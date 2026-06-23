import type { Metadata } from "next";
import Link from "next/link";
import Container from "./components/Container";
import Button from "./components/Button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center">
      <Container size="wide" className="py-32 sm:py-48">
        <p className="brand-eyebrow text-slate">404</p>
        <h1 className="font-display mt-6 text-[3rem] leading-[1.05] tracking-tight sm:text-[4rem] lg:text-[5rem]">
          Nothing here.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-navy/75">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/" size="lg">
            Back to home
          </Button>
          <Button href="/contact" size="lg" variant="secondary">
            Contact us
          </Button>
        </div>
      </Container>
    </section>
  );
}
