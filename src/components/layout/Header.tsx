"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/",          label: "Simulate"  },
  { href: "/globe",     label: "Globe"     },
  { href: "/optimize",  label: "Optimize"  },
  { href: "/portfolio", label: "Portfolio" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950">
      {/* Main bar */}
      <div className="flex h-12 items-center px-4 sm:px-6 max-w-7xl mx-auto gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110">
            {/* Orbit ring */}
            <ellipse cx="12" cy="12" rx="11" ry="4" stroke="#4ade80" strokeWidth="0.75" strokeOpacity="0.3" transform="rotate(-22 12 12)"/>
            {/* Globe body */}
            <circle cx="12" cy="12" r="7.5" stroke="#4ade80" strokeWidth="1.5" fill="rgba(74,222,128,0.06)"/>
            {/* Equator */}
            <ellipse cx="12" cy="12" rx="7.5" ry="2.5" stroke="#4ade80" strokeWidth="0.75" strokeOpacity="0.45"/>
            {/* Meridian */}
            <line x1="12" y1="4.5" x2="12" y2="19.5" stroke="#4ade80" strokeWidth="0.75" strokeOpacity="0.45"/>
            {/* Orbiting satellite */}
            <circle cx="21" cy="8.5" r="1.6" fill="#4ade80"/>
          </svg>
          <span className="text-sm font-bold tracking-tight">
            <span className="text-emerald-400">P</span><span className="text-zinc-100">lanetary</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} active={pathname === l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop tech stack — right side, only on large screens */}
        <div className="hidden lg:block ml-auto text-xs font-mono text-zinc-500">
          Powered by NVIDIA (NIM · Cosmos World Foundation Model · cuOpt) · Context.dev · Cala Knowledge API
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden ml-auto p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {open && (
        <nav className="sm:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-0.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === l.href
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              {l.label}
            </Link>
          ))}
          <p className="px-3 pt-3 pb-1 text-[11px] font-mono text-zinc-700">
            Powered by NVIDIA (NIM · Cosmos · cuOpt) · Cala
          </p>
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded text-sm transition-colors",
        active ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
      )}
    >
      {children}
    </Link>
  );
}
