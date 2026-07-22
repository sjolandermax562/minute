"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RoundProof, fmtCredits, fmtPrice } from "@/lib/engine";
import { Section } from "./Primitives";

export default function Resolution({ history }: { history: RoundProof[] }) {
  const last = history[0] ?? null;

  return (
    <Section index="03" title="RESOLUTION" right="LAST SETTLED ROUND">
      {!last ? (
        <div className="bg-void px-4 py-12 text-center md:px-8">
          <span className="font-mono text-xs tracking-[0.2em] text-dim">
            [ NO SETTLED ROUNDS YET // STAND BY ]
            <span className="cursor-blink">_</span>
          </span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={last.roundId}
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-2 gap-px bg-edge md:grid-cols-5">
              <div className="bg-void p-4 md:p-6">
                <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
                  LOCK PRINT
                </div>
                <div className="font-mono text-xl font-bold tabular-nums text-ink md:text-2xl">
                  ${fmtPrice(last.lockPrice)}
                </div>
              </div>
              <div className="bg-void p-4 md:p-6">
                <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
                  CLOSE PRINT
                </div>
                <div className="font-mono text-xl font-bold tabular-nums text-ink md:text-2xl">
                  ${fmtPrice(last.closePrice)}
                </div>
              </div>
              <div className="bg-void p-4 md:p-6">
                <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
                  DELTA
                </div>
                <div
                  className={`font-mono text-xl font-bold tabular-nums md:text-2xl ${
                    last.outcome === "DOWN" ? "text-hazard" : "text-ink"
                  }`}
                >
                  {last.closePrice - last.lockPrice >= 0 ? "+" : ""}
                  {(last.closePrice - last.lockPrice).toFixed(4)}
                </div>
              </div>
              <div className="bg-void p-4 md:p-6">
                <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
                  WINNING SIDE
                </div>
                <div
                  className={`font-mono text-xl font-bold tracking-[0.1em] md:text-2xl ${
                    last.outcome === "DOWN" ? "text-hazard" : "text-ink"
                  }`}
                >
                  {last.outcome}
                </div>
              </div>
              <div className="col-span-2 bg-void p-4 md:col-span-1 md:p-6">
                <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
                  YOUR PAYOUT
                </div>
                {last.userStake > 0 ? (
                  <div
                    className={`font-mono text-xl font-bold tabular-nums md:text-2xl ${
                      last.pnl < 0 ? "text-hazard" : "text-ink"
                    }`}
                  >
                    {fmtCredits(last.payout)} CR
                    <span className="ml-2 text-xs text-dim">
                      ({last.pnl >= 0 ? "+" : ""}
                      {last.pnl.toFixed(2)})
                    </span>
                  </div>
                ) : (
                  <div className="font-mono text-sm tracking-[0.1em] text-dim">
                    NO POSITION
                  </div>
                )}
              </div>
            </div>

            {/* proof strings */}
            <div className="border-t border-edge bg-carbon px-4 py-4 md:px-8">
              <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
                PROOF // RE-QUERY HERMES AT THESE TIMESTAMPS
              </div>
              <div className="space-y-1 font-mono text-[11px] tracking-[0.08em] text-ash">
                <div>
                  <span className="text-dim">&gt;&gt;&gt;</span> ROUND{" "}
                  {last.roundId} LOCK :: HERMES T={last.lockT} PUB={last.lockPub}
                </div>
                <div>
                  <span className="text-dim">&gt;&gt;&gt;</span> ROUND{" "}
                  {last.roundId} CLOSE :: HERMES T={last.closeT} PUB=
                  {last.closePub}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </Section>
  );
}
