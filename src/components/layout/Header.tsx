"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950">
      <div className="flex h-12 items-center px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <div className="w-5 h-5 rounded-sm bg-zinc-100 flex items-center justify-center">
            <span className="text-zinc-950 text-[10px] font-bold leading-none">P</span>
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">Planetary</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          <NavLink href="/" active={pathname === "/"}>Simulate</NavLink>
          <NavLink href="/globe" active={pathname === "/globe"}>Globe</NavLink>
          <NavLink href="/optimize" active={pathname === "/optimize"}>Optimize</NavLink>
          <NavLink href="/portfolio" active={pathname === "/portfolio"}>Portfolio</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-4 text-xs text-zinc-500">
          <span className="font-mono">NVIDIA NIM · Cosmos · cuOpt</span>
          <span className="font-mono text-zinc-600">Cala</span>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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
