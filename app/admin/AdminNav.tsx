"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const NAV_LINKS = [
  { href: "/admin/results", label: "Results" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/survey-builder", label: "Survey Builder" },
];

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-line bg-ivory/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <span className="relative inline-block overflow-hidden rounded-sm" style={{ width: 36, height: 36 }}>
              <Image src="/jns-logo.png" alt="" fill sizes="36px" className="object-contain" />
            </span>
            <span className="font-display text-lg text-navy">JNS Admin</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm transition-colors whitespace-nowrap ${
                  pathname === l.href ? "font-medium text-navy" : "text-slate hover:text-navy"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: sign out — separated by auto margin so it never crowds nav */}
        <button
          onClick={() => signOut(auth).then(() => router.push("/admin"))}
          className="ml-8 shrink-0 text-sm text-slate hover:text-navy transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Mobile nav row */}
      <div className="sm:hidden flex items-center gap-5 overflow-x-auto px-6 pb-3 border-t border-slate-line/50">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm whitespace-nowrap transition-colors ${
              pathname === l.href ? "font-medium text-navy" : "text-slate hover:text-navy"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
