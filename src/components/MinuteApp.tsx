"use client";

import { useMarket } from "@/lib/useMarket";
import Hero from "./Hero";
import Board from "./Board";
import Resolution from "./Resolution";
import Tape from "./Tape";
import Ledger from "./Ledger";
import OracleSpec from "./OracleSpec";
import SiteFooter from "./SiteFooter";

export default function MinuteApp() {
  const m = useMarket();

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] border-x border-edge bg-void">
      <Hero
        rid={m.rid}
        secondsLeft={m.secondsLeft}
        tick={m.tick}
        dir={m.dir}
        handle={m.handle}
        walletAvailable={m.walletAvailable}
        walletConnected={m.walletConnected}
        onConnect={m.connect}
        onDisconnect={m.disconnect}
      />
      <Board
        rid={m.rid}
        elapsed={m.elapsed}
        secondsLeft={m.secondsLeft}
        bettingOpen={m.bettingOpen}
        tick={m.tick}
        dir={m.dir}
        lock={m.lock}
        bets={m.bets}
        poolUp={m.poolUp}
        poolDown={m.poolDown}
        userUp={m.userUp}
        userDown={m.userDown}
        bankroll={m.bankroll}
        resolving={m.resolving !== null}
        onBet={m.placeBet}
      />
      <Resolution history={m.history} />
      <Tape tape={m.tape} />
      <Ledger
        bankroll={m.bankroll}
        record={m.record}
        streak={m.streak}
        history={m.history}
        onRefill={m.refill}
      />
      <OracleSpec />
      <SiteFooter />
    </main>
  );
}
