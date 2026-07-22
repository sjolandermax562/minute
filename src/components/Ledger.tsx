"use client";

import { RoundProof, fmtCredits } from "@/lib/engine";
import { WinLoss } from "@/lib/useMarket";
import { DataCell, Section } from "./Primitives";

interface LedgerProps {
  bankroll: number;
  record: WinLoss;
  streak: number;
  history: RoundProof[];
  onRefill: () => void;
}

export default function Ledger({
  bankroll,
  record,
  streak,
  history,
  onRefill,
}: LedgerProps) {
  const played = history.filter((h) => h.userStake > 0).slice(0, 10);

  return (
    <Section index="05" title="LEDGER" right="STORED LOCALLY">
      <div className="grid grid-cols-2 gap-px bg-edge lg:grid-cols-4">
        <DataCell label="BANKROLL">
          <div className="font-mono text-3xl font-bold tabular-nums text-ink md:text-4xl">
            {fmtCredits(bankroll)}
            <span className="ml-1 text-sm text-dim">CR</span>
          </div>
          {bankroll < 10 ? (
            <button
              onClick={onRefill}
              className="cell-hover mt-3 border border-ink px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-ink hover:bg-ink hover:text-void"
            >
              [ REFILL 1000 CR ]
            </button>
          ) : null}
        </DataCell>
        <DataCell label="RECORD">
          <div className="font-mono text-3xl font-bold tabular-nums md:text-4xl">
            <span className="text-ink">{record.w}W</span>
            <span className="text-dim"> / </span>
            <span className="text-hazard">{record.l}L</span>
          </div>
        </DataCell>
        <DataCell label="CURRENT STREAK">
          <div className="font-mono text-3xl font-bold tabular-nums text-ink md:text-4xl">
            {streak}
            <span className="ml-1 text-sm text-dim">
              {streak === 1 ? "WIN" : "WINS"}
            </span>
          </div>
        </DataCell>
        <DataCell label="ROUNDS SETTLED">
          <div className="font-mono text-3xl font-bold tabular-nums text-ink md:text-4xl">
            {history.length}
          </div>
        </DataCell>
      </div>

      <div className="border-t border-edge bg-void px-4 py-4 md:px-8">
        <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-dim">
          PER-ROUND P&amp;L // LAST {played.length} PLAYED
        </div>
        {played.length === 0 ? (
          <div className="font-mono text-[11px] tracking-[0.1em] text-dim">
            NO PLAYED ROUNDS ON THIS MACHINE.
          </div>
        ) : (
          <div className="space-y-1">
            {played.map((h) => (
              <div
                key={h.roundId}
                className="row-in flex flex-wrap justify-between gap-x-6 font-mono text-[11px] tracking-[0.08em]"
              >
                <span className="text-dim">[ ROUND {h.roundId} ]</span>
                <span className={h.outcome === "DOWN" ? "text-hazard" : "text-ink"}>
                  {h.outcome}
                </span>
                <span className="text-ash">
                  STAKE {fmtCredits(h.userStake)} CR
                </span>
                <span className={h.pnl < 0 ? "text-hazard" : "text-ink"}>
                  {h.pnl >= 0 ? "+" : ""}
                  {h.pnl.toFixed(2)} CR
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
