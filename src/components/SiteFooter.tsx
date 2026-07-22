"use client";

import { Crosshair } from "./Primitives";

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-edge">
      <Crosshair className="-top-[5px] -left-[5px]" />
      <Crosshair className="-top-[5px] -right-[5px]" />
      <div className="flex flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-8">
        <span className="font-mono text-[11px] tracking-[0.15em] text-ash">
          Not financial advice. The oracle is real. The money is not.
        </span>
        <span className="font-mono text-[11px] tracking-[0.15em] text-dim">
          [ MINUTE REV 1.0 // PYTH HERMES // SOL-USD ]
        </span>
      </div>
    </footer>
  );
}
