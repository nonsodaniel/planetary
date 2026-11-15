"use client";

import { motion } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";

export function GlobeHeroOverlay() {
  return (
    <>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute top-4 left-0 right-0 z-10 flex flex-col items-center text-center pointer-events-none"
      >
        <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-zinc-100 leading-tight px-4">
          Do climate projects
          <span className="text-zinc-400"> actually work?</span>
        </h1>
        <p className="hidden sm:block text-sm text-zinc-500 mt-1.5">
          Hover a pin to see what the science says. Scroll to learn more.
        </p>
        <p className="sm:hidden text-xs text-zinc-500 mt-1">
          Tap a pin to explore. Scroll down to learn more.
        </p>
      </motion.div>

      {/* Full globe CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute top-4 right-3 sm:right-6 z-10"
      >
        <Link
          href="/globe"
          className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          Full Globe View
        </Link>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-100 pointer-events-none z-10"
      >
        <span className="text-xs font-mono tracking-wide">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </>
  );
}
