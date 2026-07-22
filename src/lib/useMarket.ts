"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BET_CUTOFF_SEC,
  START_BANKROLL,
  BotBet,
  RoundProof,
  Side,
  UserBet,
  botSchedule,
  fmtPrice,
  mulberry32,
  resolveOutcome,
  roundEnd,
  roundIdAt,
  roundStart,
  settleRound,
} from "./engine";

export interface PriceTick {
  price: number;
  conf: number;
  publishTime: number;
  slot: number | null;
}

export interface ResolvePrint {
  t: number;
  price: number;
  conf: number;
  publishTime: number;
}

export type TapeKind = "bot" | "user" | "sys" | "win" | "lose";

export interface TapeEntry {
  id: number;
  clock: string;
  msg: string;
  kind: TapeKind;
}

export interface WinLoss {
  w: number;
  l: number;
}

interface PendingRound {
  roundId: number;
  lock: ResolvePrint;
  bets: UserBet[];
  bots: BotBet[];
}

const LS = {
  bankroll: "minute:bankroll",
  record: "minute:record",
  streak: "minute:streak",
  history: "minute:history",
  handle: "minute:handle",
  bets: "minute:bets",
};

const HANDLES = [
  "GHOST", "VIPER", "STATIC", "VECTOR", "CIPHER", "RADAR",
  "ORBIT", "SIGNAL", "PATCH", "NULL", "TALON", "MIRAGE",
];

function clockStr(): string {
  return new Date().toUTCString().slice(17, 25);
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function useMarket() {
  const [now, setNow] = useState(() => Date.now());
  const rid = roundIdAt(now);
  const nowSec = Math.floor(now / 1000);
  const elapsed = nowSec - roundStart(rid);
  const secondsLeft = Math.max(0, roundEnd(rid) - nowSec);

  const [tick, setTick] = useState<PriceTick | null>(null);
  const [dir, setDir] = useState<0 | 1 | -1>(0);
  const [lock, setLock] = useState<ResolvePrint | null>(null);
  const [bets, setBets] = useState<UserBet[]>([]);
  const [firedBots, setFiredBots] = useState<BotBet[]>([]);
  const [tape, setTape] = useState<TapeEntry[]>([]);
  const [bankroll, setBankroll] = useState(START_BANKROLL);
  const [record, setRecord] = useState<WinLoss>({ w: 0, l: 0 });
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<RoundProof[]>([]);
  const [handle, setHandle] = useState<string | null>(null);
  const [resolving, setResolving] = useState<PendingRound | null>(null);

  // Refs mirror state so interval/round-boundary code reads fresh values.
  const lockRef = useRef<ResolvePrint | null>(null);
  const betsRef = useRef<UserBet[]>([]);
  const bankrollRef = useRef(START_BANKROLL);
  const recordRef = useRef<WinLoss>({ w: 0, l: 0 });
  const streakRef = useRef(0);
  const historyRef = useRef<RoundProof[]>([]);
  const prevRidRef = useRef<number | null>(null);
  const firedCountRef = useRef(0);
  const tapeIdRef = useRef(0);
  const prevPriceRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushTape = useCallback((msg: string, kind: TapeKind = "sys") => {
    tapeIdRef.current += 1;
    const id = tapeIdRef.current;
    setTape((t) => [...t.slice(-119), { id, clock: clockStr(), msg, kind }]);
  }, []);

  const commitBankroll = useCallback((n: number) => {
    bankrollRef.current = n;
    setBankroll(n);
    lsSet(LS.bankroll, n);
  }, []);

  // ---- clock ----
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, []);

  // ---- hydrate from localStorage after mount ----
  useEffect(() => {
    const b = lsGet<number>(LS.bankroll);
    if (typeof b === "number" && b >= 0) {
      bankrollRef.current = b;
      setBankroll(b);
    }
    const r = lsGet<WinLoss>(LS.record);
    if (r && typeof r.w === "number" && typeof r.l === "number") {
      recordRef.current = r;
      setRecord(r);
    }
    const s = lsGet<number>(LS.streak);
    if (typeof s === "number") {
      streakRef.current = s;
      setStreak(s);
    }
    const h = lsGet<RoundProof[]>(LS.history);
    if (Array.isArray(h)) {
      historyRef.current = h;
      setHistory(h);
    }
    const hd = lsGet<string>(LS.handle);
    if (typeof hd === "string") setHandle(hd);

    const saved = lsGet<{ roundId: number; bets: UserBet[] }>(LS.bets);
    if (saved && saved.roundId === roundIdAt(Date.now()) && Array.isArray(saved.bets)) {
      betsRef.current = saved.bets;
      setBets(saved.bets);
      if (saved.bets.length > 0) {
        pushTape(`POSITION RESTORED :: ${saved.bets.length} OPEN BET(S)`);
      }
    }
    pushTape("MINUTE TERMINAL ONLINE // REV 1.0");
  }, [pushTape]);

  // ---- live tape: poll /api/price every 3s ----
  useEffect(() => {
    let dead = false;
    async function poll() {
      try {
        const r = await fetch("/api/price", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (dead || typeof j.price !== "number") return;
        const prev = prevPriceRef.current;
        prevPriceRef.current = j.price;
        if (prev !== null && j.price !== prev) {
          setDir(j.price > prev ? 1 : -1);
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setDir(0), 700);
        }
        setTick({
          price: j.price,
          conf: j.conf,
          publishTime: j.publishTime,
          slot: typeof j.slot === "number" ? j.slot : null,
        });
      } catch {
        /* keep last tick */
      }
    }
    poll();
    const i = setInterval(poll, 3000);
    return () => {
      dead = true;
      clearInterval(i);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // ---- round boundary ----
  useEffect(() => {
    const prev = prevRidRef.current;
    prevRidRef.current = rid;
    if (prev === null || prev === rid) return;

    const prevLock = lockRef.current;
    const prevBets = betsRef.current;
    const bots = botSchedule(prev);

    lockRef.current = null;
    setLock(null);
    betsRef.current = [];
    setBets([]);
    firedCountRef.current = 0;
    setFiredBots([]);
    try {
      localStorage.removeItem(LS.bets);
    } catch {
      /* ignore */
    }

    pushTape(`[ ROUND ${rid} ] OPEN // ORACLE LOCK REQUESTED`);
    if (prevLock) {
      setResolving({ roundId: prev, lock: prevLock, bets: prevBets, bots });
      pushTape(`[ ROUND ${prev} ] SEALED // AWAITING CLOSE PRINT`);
    } else {
      pushTape(`[ ROUND ${prev} ] VOID // NO LOCK PRINT`);
    }
  }, [rid, pushTape]);

  // ---- lock price: retry every 3s until Hermes has the print ----
  useEffect(() => {
    if (lock) return;
    let dead = false;
    const t = roundStart(rid);
    async function fetchLock() {
      try {
        const r = await fetch(`/api/resolve?t=${t}`, { cache: "no-store" });
        if (!r.ok) return; // Hermes lags a few seconds. Retry on next tick.
        const j = await r.json();
        if (dead || typeof j.price !== "number") return;
        const print: ResolvePrint = {
          t: j.t,
          price: j.price,
          conf: j.conf,
          publishTime: j.publishTime,
        };
        lockRef.current = print;
        setLock(print);
        pushTape(
          `[ ROUND ${rid} ] LOCK ${fmtPrice(j.price)} // HERMES T=${j.t} PUB=${j.publishTime}`
        );
      } catch {
        /* retry on next tick */
      }
    }
    fetchLock();
    const i = setInterval(fetchLock, 3000);
    return () => {
      dead = true;
      clearInterval(i);
    };
  }, [rid, lock, pushTape]);

  // ---- bot traffic fires on schedule ----
  useEffect(() => {
    const sched = botSchedule(rid);
    let n = 0;
    while (n < sched.length && sched[n].atSec <= elapsed) n++;
    if (n > firedCountRef.current) {
      const fresh = sched.slice(firedCountRef.current, n);
      firedCountRef.current = n;
      setFiredBots(sched.slice(0, n));
      for (const b of fresh) {
        pushTape(
          `T+${String(b.atSec).padStart(2, "0")} ${b.wallet} >> ${b.side} ${b.stake} CR`,
          "bot"
        );
      }
    }
  }, [elapsed, rid, pushTape]);

  // ---- resolve the sealed round ----
  useEffect(() => {
    if (!resolving) return;
    const target = resolving;
    let dead = false;
    const t = roundEnd(target.roundId);

    function finish(close: ResolvePrint) {
      const outcome = resolveOutcome(target.lock.price, close.price);
      const { userStake, payout, pnl } = settleRound(
        target.bets,
        target.bots,
        outcome
      );
      const proof: RoundProof = {
        roundId: target.roundId,
        lockT: roundStart(target.roundId),
        closeT: roundEnd(target.roundId),
        lockPrice: target.lock.price,
        closePrice: close.price,
        outcome,
        userStake,
        payout,
        pnl,
        lockPub: target.lock.publishTime,
        closePub: close.publishTime,
      };

      commitBankroll(bankrollRef.current + payout);

      if (userStake > 0) {
        if (pnl > 0) {
          const nr = { w: recordRef.current.w + 1, l: recordRef.current.l };
          recordRef.current = nr;
          setRecord(nr);
          lsSet(LS.record, nr);
          streakRef.current += 1;
          setStreak(streakRef.current);
          lsSet(LS.streak, streakRef.current);
        } else if (pnl < 0) {
          const nr = { w: recordRef.current.w, l: recordRef.current.l + 1 };
          recordRef.current = nr;
          setRecord(nr);
          lsSet(LS.record, nr);
          streakRef.current = 0;
          setStreak(0);
          lsSet(LS.streak, 0);
        }
      }

      const nh = [proof, ...historyRef.current].slice(0, 50);
      historyRef.current = nh;
      setHistory(nh);
      lsSet(LS.history, nh);

      const kind: TapeKind =
        outcome === "PUSH" ? "sys" : pnl > 0 ? "win" : pnl < 0 ? "lose" : "sys";
      pushTape(
        `[ ROUND ${target.roundId} ] ${outcome} // LOCK ${fmtPrice(
          proof.lockPrice
        )} CLOSE ${fmtPrice(proof.closePrice)} // P&L ${
          pnl >= 0 ? "+" : ""
        }${pnl.toFixed(2)} CR`,
        kind
      );
      setResolving(null);
    }

    async function fetchClose() {
      try {
        const r = await fetch(`/api/resolve?t=${t}`, { cache: "no-store" });
        if (!r.ok) return; // close print not indexed yet. Retry.
        const j = await r.json();
        if (dead || typeof j.price !== "number") return;
        finish({
          t: j.t,
          price: j.price,
          conf: j.conf,
          publishTime: j.publishTime,
        });
      } catch {
        /* retry on next tick */
      }
    }
    fetchClose();
    const i = setInterval(fetchClose, 3000);
    return () => {
      dead = true;
      clearInterval(i);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolving, commitBankroll, pushTape]);

  // ---- actions ----
  const placeBet = useCallback(
    (side: Side, rawStake: number): boolean => {
      const stake = Math.floor(rawStake);
      const el = Math.floor(Date.now() / 1000) - roundStart(roundIdAt(Date.now()));
      if (el >= BET_CUTOFF_SEC) return false;
      if (!Number.isFinite(stake) || stake <= 0) return false;
      if (stake > bankrollRef.current) return false;

      commitBankroll(bankrollRef.current - stake);
      const bet: UserBet = { side, stake, atSec: el };
      const nb = [...betsRef.current, bet];
      betsRef.current = nb;
      setBets(nb);
      lsSet(LS.bets, { roundId: roundIdAt(Date.now()), bets: nb });
      pushTape(
        `T+${String(el).padStart(2, "0")} ${handle ?? "YOU"} >> ${side} ${stake} CR`,
        "user"
      );
      return true;
    },
    [handle, commitBankroll, pushTape]
  );

  const connect = useCallback(() => {
    if (handle) return;
    const rng = mulberry32((Date.now() % 2147483647) >>> 0);
    const h = `${HANDLES[Math.floor(rng() * HANDLES.length)]}-${String(
      100 + Math.floor(rng() * 900)
    )}`;
    setHandle(h);
    lsSet(LS.handle, h);
    pushTape(`HANDLE ASSIGNED :: ${h}`);
  }, [handle, pushTape]);

  const refill = useCallback(() => {
    if (bankrollRef.current >= 10) return;
    commitBankroll(START_BANKROLL);
    pushTape(`BANKROLL REFILLED :: ${START_BANKROLL} CR`);
  }, [commitBankroll, pushTape]);

  // ---- derived pools ----
  const sumSide = (xs: { side: Side; stake: number }[], s: Side) =>
    xs.reduce((acc, x) => acc + (x.side === s ? x.stake : 0), 0);
  const userUp = sumSide(bets, "UP");
  const userDown = sumSide(bets, "DOWN");
  const botUp = sumSide(firedBots, "UP");
  const botDown = sumSide(firedBots, "DOWN");
  const poolUp = userUp + botUp;
  const poolDown = userDown + botDown;

  return {
    now,
    rid,
    elapsed,
    secondsLeft,
    bettingOpen: elapsed < BET_CUTOFF_SEC,
    tick,
    dir,
    lock,
    bets,
    firedBots,
    tape,
    bankroll,
    record,
    streak,
    history,
    handle,
    resolving,
    poolUp,
    poolDown,
    userUp,
    userDown,
    placeBet,
    connect,
    refill,
  };
}
