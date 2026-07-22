"use client";

import { motion } from "framer-motion";
import { PriceTick } from "@/lib/useMarket";
import { fmtPrice } from "@/lib/engine";

interface HeroProps {
  rid: number;
  secondsLeft: number;
  tick: PriceTick | null;
  dir: 0 | 1 | -1;
  handle: string | null;
  walletAvailable: boolean;
  walletConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Hero({
  rid,
  secondsLeft,
  tick,
  dir,
  handle,
  walletAvailable,
  walletConnected,
  onConnect,
  onDisconnect,
}: HeroProps) {
  const priceClass =
    dir === 1 ? "price-flash-up" : dir === -1 ? "price-flash-down" : "price-idle";

  return (
    <header className="relative">
      {/* top strip */}
      <div className="flex items-center justify-between border-b border-edge px-4 py-2 md:px-8">
        <span className="font-mono text-[11px] tracking-[0.15em] text-ash">
          [ MINUTE // SOL 60S ORACLE MARKET ]
        </span>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-[11px] tracking-[0.15em] text-dim sm:inline">
            REV 1.0
          </span>
          {handle ? (
            <div className="flex items-center gap-2">
              <span className="border border-lip px-3 py-1 font-mono text-[11px] uppercase tracking-[0.15em] text-ink">
                {handle}
              </span>
              {walletConnected && (
                <button
                  onClick={onDisconnect}
                  className="cell-hover border border-lip px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-dim hover:border-ink hover:text-ink"
                  aria-label="disconnect wallet"
                >
                  [ X ]
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={onConnect}
                className="cell-hover border border-lip px-3 py-1 font-mono text-[11px] tracking-[0.15em] text-ash hover:border-ink hover:text-ink"
              >
                [ CONNECT ]
              </button>
              {!walletAvailable && (
                <span className="font-mono text-[9px] tracking-[0.12em] text-dim">
                  NO WALLET DETECTED // SPECTATOR MODE
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-edge lg:grid-cols-12">
        {/* macro type */}
        <div className="bg-void px-4 pb-10 pt-14 md:px-8 lg:col-span-8 lg:pb-16 lg:pt-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 font-mono text-[11px] tracking-[0.2em] text-ash"
          >
            [ SOL/USD :: 60 SECOND ROUNDS :: REAL PYTH PRINTS ]
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-heavy uppercase leading-[0.85] tracking-tightest text-ink"
            style={{ fontSize: "clamp(4rem, 13vw, 14rem)" }}
          >
            MINUTE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-6 max-w-md font-mono text-xs leading-relaxed tracking-[0.08em] text-ash"
          >
            One round lasts sixty seconds. The oracle locks a print, you call up
            or down, the closing print settles it. Credits are fake. The price
            feed is not.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >
            <a
              href="#board"
              className="cell-hover inline-block border border-ink px-8 py-4 font-mono text-sm tracking-[0.2em] text-ink hover:bg-ink hover:text-void"
            >
              ENTER ROUND &gt;&gt;&gt;
            </a>
          </motion.div>
        </div>

        {/* live print + countdown */}
        <div className="grid grid-cols-1 gap-px bg-edge lg:col-span-4">
          <div className="bg-void p-6 md:p-8">
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
              LIVE SOL/USD
            </div>
            <div
              className={`font-mono text-4xl font-bold tracking-tight md:text-5xl ${priceClass}`}
            >
              {tick ? `$${fmtPrice(tick.price)}` : "---.----"}
            </div>
            <div className="mt-3 space-y-1 font-mono text-[10px] tracking-[0.15em] text-dim">
              <div>CONF ±{tick ? tick.conf.toFixed(4) : "-"}</div>
              <div>PUB {tick ? tick.publishTime : "-"}</div>
              <div>SLOT {tick?.slot ?? "-"}</div>
            </div>
          </div>
          <div className="bg-void p-6 md:p-8">
            <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-dim">
              [ ROUND {rid} ] CLOSES IN
            </div>
            <div className="font-mono text-6xl font-bold tabular-nums tracking-tight text-ink md:text-7xl">
              {String(secondsLeft).padStart(2, "0")}
              <span className="text-2xl text-dim">s</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
