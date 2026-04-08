import Link from "next/link";
import Image from "next/image";
import { Copyright, ExternalLink, Heart, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/65 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md">
                <Image
                  src="/newlogo.png"
                  alt="TrueGrade AI Logo"
                  fill
                  sizes="(max-width: 640px) 56px, 64px"
                  className="object-contain p-1.5"
                />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-foreground">TrueGrade AI</h3>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A modern platform for secure examinations, smart paper generation, and faster evaluation workflows for students, faculty, and administrators.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Trusted, role-based, and exam-ready.
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link href="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="text-muted-foreground transition-colors hover:text-foreground">Terms</Link>
              <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">Contact</Link>
              <Link href="/developers" className="text-muted-foreground transition-colors hover:text-foreground">Developers</Link>
              <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">Login</Link>
              <Link href="/signup" className="text-muted-foreground transition-colors hover:text-foreground">Signup</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Creator</h4>
            <p className="text-sm text-muted-foreground">Built and maintained by Mohammad Iqbal.</p>
            <a
              href="https://iqbaldev.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              iqbaldev.in <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-5">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
            <p className="flex items-center gap-2">
              <Copyright className="size-4" />
              {new Date().getFullYear()} TrueGrade AI. All rights reserved.
            </p>
            <p className="flex items-center gap-2">
              Made with <Heart className="size-3.5 fill-red-500 text-red-500" /> by Mohammad Iqbal
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
