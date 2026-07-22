"use client";

import { motion } from "framer-motion";
import React from "react";

export function Crosshair({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute select-none font-mono text-xs text-dim ${className}`}
    >
      +
    </span>
  );
}

interface SectionProps {
  id?: string;
  index: string;
  title: string;
  right?: string;
  children: React.ReactNode;
}

export function Section({ id, index, title, right, children }: SectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative border-t border-edge"
    >
      <Crosshair className="-top-[5px] -left-[5px]" />
      <Crosshair className="-top-[5px] -right-[5px]" />
      <div className="flex items-center justify-between border-b border-edge px-4 py-2 md:px-8">
        <h2 className="font-mono text-[11px] tracking-[0.15em] text-ash">
          [ {index} // {title} ]
        </h2>
        {right ? (
          <span className="font-mono text-[11px] tracking-[0.15em] text-dim">
            {right}
          </span>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}

export function DataCell({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-void p-4 md:p-6 ${className}`}>
      <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
        {label}
      </div>
      {children}
    </div>
  );
}
