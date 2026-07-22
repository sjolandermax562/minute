"use client";

import { useState } from "react";
import {
  BET_CUTOFF_SEC,
  Side,
  UserBet,
  fmtCredits,
  fmtPrice,
} from "@/lib/engine";
import { PriceTick, ResolvePrint } from "@/lib/useMarket";
import { DataCell, Section } from "./Primitives";

interface BoardProps {
  rid: number;
  elapsed: number;
  secondsLeft: number;
  bettingOpen: boolean;
  tick: PriceTick | null;
  dir: 0 | 1 | -1;
  lock: ResolvePrint | null;
  bets: UserBet[];
  poolUp: number;
  poolDown: number;
  userUp: number;
  userDown: number;
  bankroll: number;
  resolving: boolean;
  onBet: (side: Side, stake: number) => boolean;
}

const CHIPS = [10, 25, 50, 100];

export default function Board(props: BoardProps) {
  const {
    rid,
    elapsed,
    secondsLeft,
    bettingOpen,
    tick,
    dir,
    lock,
    bets,
    poolUp,
    poolDown,
    userUp,
    userDown,
    bankroll,
    resolving,
    onBet,
  } = props;

  const [stake, setStake] = useState("25");
  const [flashErr, setFlashErr] = useState(false);

  const total = poolUp + poolDown;
  const upPct = total > 0 ? (poolUp / total) * 100 : 50;
  const downPct = 100 - upPct;

  const priceClass =
    dir === 1 ? "price-flash-up" : dir === -1 ? "price-flash-down" : "price-idle";

  const stakeNum = Math.floor(Number(stake));
  const stakeValid =
    Number.isFinite(stakeNum) && stakeNum > 0 && stakeNum <= bankroll;

  function tryBet(side: Side) {
    const ok = onBet(side, Number(stake));
    if (!ok) {
      setFlashErr(true);
      setTimeout(() => setFlashErr(false), 400);
    }
  }

  const liveVsLock =
    lock && tick ? tick.price - lock.price : null;

  return (
    <Section
      id="board"
      index="02"
      title="THE BOARD"
      right={`[ ROUND ${rid} ]${resolving ? " // SETTLING PREV" : ""}`}
    >
      {/* readouts */}
      <div className="grid grid-cols-1 gap-px bg-edge md:grid-cols-3">
        <DataCell label="LOCK PRINT // HERMES">
          {lock ? (
            <>
              <div className="font-mono text-3xl font-bold tabular-nums text-ink md:text-4xl">
                ${fmtPrice(lock.price)}
              </div>
              <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-dim">
                T={lock.t} PUB={lock.publishTime}
              </div>
            </>
          ) : (
            <div className="font-mono text-2xl font-bold tracking-[0.1em] text-ash">
              AWAITING PRINT
              <span className="cursor-blink">_</span>
            </div>
          )}
        </DataCell>

        <DataCell label="LIVE PRINT // PYTH SOL-USD">
          <div
            className={`font-mono text-3xl font-bold tabular-nums md:text-4xl ${priceClass}`}
          >
            {tick ? `$${fmtPrice(tick.price)}` : "---.----"}
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-dim">
            {liveVsLock !== null ? (
              <>
                VS LOCK{" "}
                <span className={liveVsLock >= 0 ? "text-ink" : "text-hazard"}>
                  {liveVsLock >= 0 ? "+" : ""}
                  {liveVsLock.toFixed(4)}
                </span>
              </>
            ) : (
              "VS LOCK -"
            )}{" "}
            :: SLOT {tick?.slot ?? "-"}
          </div>
        </DataCell>

        <DataCell label="T-MINUS">
          <div className="font-mono text-5xl font-bold tabular-nums tracking-tight text-ink md:text-6xl">
            {String(secondsLeft).padStart(2, "0")}
            <span className="text-xl text-dim">s</span>
          </div>
          <div
            className={`mt-2 font-mono text-[10px] tracking-[0.2em] ${
              bettingOpen ? "text-ash" : "text-hazard"
            }`}
          >
            {bettingOpen ? "BETTING OPEN" : "BETTING CLOSED"}
          </div>
          {/* elapsed sweep */}
          <div className="mt-3 h-2 w-full border border-lip">
            <div
              className={`h-full ${elapsed >= BET_CUTOFF_SEC ? "sweep-stripes" : "bg-ink"}`}
              style={{ width: `${Math.min(100, (elapsed / 60) * 100)}%` }}
            />
          </div>
        </DataCell>
      </div>

      {/* pool split */}
      <div className="grid grid-cols-1 gap-px bg-edge lg:grid-cols-2">
        <DataCell label="POOL SPLIT // USER + BOTS">
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between font-mono text-[10px] tracking-[0.15em] text-ash">
                <span>UP</span>
                <span>
                  {fmtCredits(poolUp)} CR :: {upPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 w-full border border-lip">
                <div
                  className="h-full bg-ink transition-all duration-500"
                  style={{ width: `${upPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between font-mono text-[10px] tracking-[0.15em] text-ash">
                <span>DOWN</span>
                <span>
                  {fmtCredits(poolDown)} CR :: {downPct.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 w-full border border-lip">
                <div
                  className="h-full bg-hazard transition-all duration-500"
                  style={{ width: `${downPct}%` }}
                />
              </div>
            </div>
            <div className="pt-1 font-mono text-[10px] tracking-[0.15em] text-dim">
              YOUR EXPOSURE :: UP {fmtCredits(userUp)} CR / DOWN{" "}
              {fmtCredits(userDown)} CR
            </div>
          </div>
        </DataCell>

        {/* stake + actions */}
        <DataCell label="STAKE // FAKE CREDITS">
          <div className="flex flex-wrap items-stretch gap-px bg-edge">
            <input
              type="number"
              min={1}
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className={`w-28 border bg-void px-3 py-3 font-mono text-lg tabular-nums outline-none ${
                flashErr
                  ? "border-hazard text-hazard"
                  : "border-lip text-ink focus:border-ink"
              }`}
              aria-label="stake"
            />
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setStake(String(c))}
                className="cell-hover border border-lip bg-void px-3 font-mono text-[11px] text-ash hover:border-ink hover:text-ink"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-px bg-edge">
            <button
              onClick={() => tryBet("UP")}
              disabled={!bettingOpen || !stakeValid}
              className="cell-hover border border-ink bg-void px-4 py-4 font-mono text-sm font-bold tracking-[0.2em] text-ink hover:bg-ink hover:text-void disabled:cursor-not-allowed disabled:border-lip disabled:text-dim disabled:hover:bg-void"
            >
              UP &gt;&gt;&gt;
            </button>
            <button
              onClick={() => tryBet("DOWN")}
              disabled={!bettingOpen || !stakeValid}
              className="cell-hover border border-hazard bg-void px-4 py-4 font-mono text-sm font-bold tracking-[0.2em] text-hazard hover:bg-hazard hover:text-void disabled:cursor-not-allowed disabled:border-lip disabled:text-dim disabled:hover:bg-void"
            >
              DOWN &lt;&lt;&lt;
            </button>
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.15em] text-dim">
            BANKROLL {fmtCredits(bankroll)} CR
            {!bettingOpen ? " // LAST 5S LOCKOUT" : ""}
          </div>

          {/* active position */}
          <div className="mt-4 border-t border-edge pt-3">
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
              ACTIVE POSITION // THIS ROUND
            </div>
            {bets.length === 0 ? (
              <div className="font-mono text-[11px] tracking-[0.1em] text-dim">
                NO POSITION. PICK A SIDE.
              </div>
            ) : (
              <div className="max-h-28 space-y-1 overflow-y-auto scroll-thin">
                {bets.map((b, i) => (
                  <div
                    key={i}
                    className="row-in flex justify-between font-mono text-[11px] tracking-[0.1em]"
                  >
                    <span className={b.side === "UP" ? "text-ink" : "text-hazard"}>
                      {b.side}
                    </span>
                    <span className="text-ash">
                      {b.stake} CR @ T+{String(b.atSec).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DataCell>
      </div>
    </Section>
  );
}
