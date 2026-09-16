import Link from "next/link";
import { Heart, Settings2 } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-[color-mix(in_srgb,var(--pearl)_72%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rose)] text-white shadow-[0_8px_24px_rgba(232,90,122,0.35)] transition-transform duration-300 group-hover:scale-105">
            <Heart className="h-4 w-4 fill-current" />
          </span>
          <div className="leading-tight">
            <p className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
              Daily Prompt
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              For your forever mornings
            </p>
          </div>
        </Link>

        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/50 px-3.5 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--rose)]/40 hover:bg-white/80"
        >
          <Settings2 className="h-4 w-4 text-[var(--rose)]" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </div>
    </header>
  );
}
