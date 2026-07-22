"use client";

import { useEffect, useRef } from "react";
import { TapeEntry } from "@/lib/useMarket";
import { Section } from "./Primitives";

const KIND_CLASS: Record<TapeEntry["kind"], string> = {
  bot: "text-dim",
  user: "text-ink",
  sys: "text-ash",
  win: "text-ink font-bold",
  lose: "text-hazard",
};

export default function Tape({ tape }: { tape: TapeEntry[] }) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [tape]);

  return (
    <Section index="04" title="TAPE" right={`${tape.length} ENTRIES`}>
      <div
        ref={boxRef}
        className="h-64 overflow-y-auto scroll-thin bg-void px-4 py-3 md:px-8"
      >
        {tape.length === 0 ? (
          <div className="font-mono text-[11px] tracking-[0.1em] text-dim">
            TAPE EMPTY<span className="cursor-blink">_</span>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {tape.map((e) => (
              <div
                key={e.id}
                className={`row-in whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed tracking-[0.06em] ${KIND_CLASS[e.kind]}`}
              >
                <span className="text-dim">{e.clock}</span>{" "}
                <span className="text-dim">::</span> {e.msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
