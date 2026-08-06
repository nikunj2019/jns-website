"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadIcon, ShareIcon } from "./icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari doesn't implement the display-mode media query.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports itself as a Mac; the touch points give it away.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

/**
 * "Add to Home Screen".
 *
 * Chrome, Edge, and Android fire `beforeinstallprompt`, so they get a real
 * one-tap install. iOS Safari never fires it and exposes no install API at all,
 * so iOS users get the manual Share-sheet instructions instead — that's the
 * platform's only path, not a shortcut we're taking.
 */
/** Subscribes to display-mode changes so the button disappears once installed. */
function subscribeDisplayMode(onChange: () => void): () => void {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

const noopSubscribe = () => () => {};

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  // These are browser facts, not React state — reading them through
  // useSyncExternalStore keeps the server render (`false`) and the client render
  // consistent without a mount-time state update.
  const installed = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  const ios = useSyncExternalStore(noopSubscribe, isIOS, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Already installed, or a browser that can't install at all — say nothing.
  if (installed) return null;
  if (!deferred && !ios) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      // The `appinstalled` event drives the installed state; all we do here is
      // drop the one-shot prompt, which can't be replayed either way.
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    setShowIOSHelp((v) => !v);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={ios ? showIOSHelp : undefined}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-brass/45 bg-brass/10 px-4 py-3.5 text-sm font-medium text-brass-soft transition-colors hover:bg-brass/20 active:scale-[0.99]"
      >
        <DownloadIcon size={18} />
        Add to Home Screen
      </button>

      {showIOSHelp && (
        <div className="mt-2 rounded-xl border border-cream-golf/12 bg-fairway-800 p-4 text-sm leading-relaxed text-cream-golf/80">
          <p className="mb-2 font-medium text-cream-golf">On iPhone and iPad:</p>
          <ol className="space-y-1.5 text-[0.82rem]">
            <li className="flex gap-2">
              <span className="text-brass">1.</span>
              <span className="flex flex-wrap items-center gap-1">
                Tap the Share button
                <span className="inline-flex text-brass-soft">
                  <ShareIcon size={15} />
                </span>
                at the bottom of Safari
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brass">2.</span>
              <span>
                Scroll down and choose <strong className="text-cream-golf">Add to Home Screen</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-brass">3.</span>
              <span>
                Tap <strong className="text-cream-golf">Add</strong>
              </span>
            </li>
          </ol>
          <p className="mt-3 text-[0.72rem] text-cream-golf/50">
            Safari only — Chrome on iOS can&rsquo;t add to the home screen.
          </p>
        </div>
      )}
    </div>
  );
}
