"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import Logo from "./Logo";
import Button from "./Button";

const NAV = [
  { label: "Services", href: "/services" },
  { label: "Process", href: "/#process" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ivory/85 backdrop-blur-md border-b border-slate-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <Container size="wide">
        <div className="flex h-28 items-center justify-between">
          <Logo size={94} showWordmark={false} />

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href.startsWith("/") &&
                  !item.href.includes("#") &&
                  item.href !== "/" &&
                  pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm tracking-tight transition-colors ${
                    active ? "text-navy" : "text-slate hover:text-navy"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Button href="/contact" size="md">
              Book a consult
            </Button>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center text-navy"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
              {open ? (
                <path d="M2 2L18 12M18 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              ) : (
                <>
                  <path d="M0 1H20" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 7H20" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 13H20" stroke="currentColor" strokeWidth="1.5" />
                </>
              )}
            </svg>
          </button>
        </div>
      </Container>

      {open && (
        <div className="md:hidden border-t border-slate-line bg-ivory">
          <Container size="wide">
            <nav className="flex flex-col py-6 gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-base text-navy border-b border-slate-line/60 last:border-b-0"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-5">
                <Button
                  href="/contact"
                  size="md"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Book a consult
                </Button>
              </div>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
