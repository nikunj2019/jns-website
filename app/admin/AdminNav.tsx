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
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative inline-block" style={{ width: 32, height: 32 }}>
              <Image src="/jns-logo.png" alt="" fill sizes="32px" className="scale-[1.45] object-contain" />
            </span>
            <span className="font-display text-lg text-navy">JNS Admin</span>
          </Link>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname === l.href ? "font-medium text-navy" : "text-slate hover:text-navy"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => signOut(auth).then(() => router.push("/admin"))}
          className="text-sm text-slate hover:text-navy transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
