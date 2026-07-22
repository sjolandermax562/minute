"use client";

import { PYTH_SOL_ID } from "@/lib/engine";
import { Section } from "./Primitives";

const LATEST_URL =
  "https://hermes.pyth.network/v2/updates/price/latest?ids[]=" + PYTH_SOL_ID;
const TIMED_URL =
  "https://hermes.pyth.network/v2/updates/price/{t}?ids[]=" + PYTH_SOL_ID;

export default function OracleSpec() {
  return (
    <Section index="06" title="ORACLE SPEC" right="READ ONLY">
      <div className="grid grid-cols-1 gap-px bg-edge md:grid-cols-2">
        <div className="bg-void p-4 md:p-8">
          <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-dim">
            ENDPOINTS
          </div>
          <div className="space-y-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ash">
            <p className="break-all">
              <span className="text-ink">GET</span> {LATEST_URL}
            </p>
            <p className="break-all">
              <span className="text-ink">GET</span> {TIMED_URL}
            </p>
            <p className="text-dim">
              Both served through this site&apos;s API routes. No key, no
              account, no cost.
            </p>
          </div>
        </div>

        <div className="bg-void p-4 md:p-8">
          <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-dim">
            PRICE ID
          </div>
          <p className="break-all font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ash">
            {PYTH_SOL_ID}
          </p>
          <p className="mt-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-dim">
            Pyth&apos;s SOL/USD feed. Publishers push price updates on Solana;
            Hermes serves those updates over plain HTTP.
          </p>
        </div>

        <div className="bg-void p-4 md:p-8">
          <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-dim">
            WHAT A SLOT IS
          </div>
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ash">
            A Solana slot is one tick of the network&apos;s clock, roughly 400
            milliseconds. Each Pyth update carries the slot that produced it.
            The slot pins every print on this page to a specific point in the
            chain&apos;s history. Watch it climb in the live readout.
          </p>
        </div>

        <div className="bg-void p-4 md:p-8">
          <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-dim">
            WHY PRINTS ARE VERIFIABLE
          </div>
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ash">
            Hermes archives past updates. Ask for timestamp T and you get the
            print Pyth published at T, today or next month. MINUTE locks and
            settles every round on those timestamps and shows you both. Query
            the same URLs yourself. If the numbers here were cooked, the
            archive would contradict them.
          </p>
        </div>
      </div>
    </Section>
  );
}
