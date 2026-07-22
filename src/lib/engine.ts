// MINUTE round engine. Pure functions only. No React, no fetch, no storage.

export const ROUND_SECONDS = 60;
export const BET_CUTOFF_SEC = 55; // no bets in the last 5 seconds
export const START_BANKROLL = 1000;
export const PYTH_SOL_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

export type Side = "UP" | "DOWN";
export type Outcome = "UP" | "DOWN" | "PUSH";

export interface BotBet {
  wallet: string;
  side: Side;
  stake: number;
  atSec: number;
}

export interface UserBet {
  side: Side;
  stake: number;
  atSec: number;
}

export interface RoundProof {
  roundId: number;
  lockT: number;
  closeT: number;
  lockPrice: number;
  closePrice: number;
  outcome: Outcome;
  userStake: number;
  payout: number;
  pnl: number;
  lockPub: number;
  closePub: number;
}

export function roundIdAt(nowMs: number): number {
  return Math.floor(nowMs / 1000 / ROUND_SECONDS);
}

export function roundStart(id: number): number {
  return id * ROUND_SECONDS;
}

export function roundEnd(id: number): number {
  return (id + 1) * ROUND_SECONDS;
}

// mulberry32: small deterministic PRNG. Same seed, same stream.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a over a tagged round id so adjacent rounds get unrelated seeds.
export function seedFromRound(roundId: number): number {
  let h = 2166136261 >>> 0;
  const s = `MINUTE:${roundId}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const HEX = "0123456789ABCDEF";

// Deterministic bot traffic for a round. Replay the round id, get the same tape.
export function botSchedule(roundId: number): BotBet[] {
  const rng = mulberry32(seedFromRound(roundId));
  const count = 5 + Math.floor(rng() * 8); // 5..12 bots
  const bets: BotBet[] = [];
  for (let i = 0; i < count; i++) {
    let wallet = "0x";
    for (let j = 0; j < 4; j++) wallet += HEX[Math.floor(rng() * 16)];
    const side: Side = rng() < 0.5 ? "UP" : "DOWN";
    const stake = 10 + Math.floor(rng() * 15) * 10 + Math.floor(rng() * 10);
    const atSec = 3 + Math.floor(rng() * (BET_CUTOFF_SEC - 10)); // 3..47
    bets.push({ wallet, side, stake, atSec });
  }
  bets.sort((a, b) => a.atSec - b.atSec);
  return bets;
}

export function resolveOutcome(lock: number, close: number): Outcome {
  if (close > lock) return "UP";
  if (close < lock) return "DOWN";
  return "PUSH";
}

// Winners split the losing pool pro-rata. PUSH returns every stake.
export function settleRound(
  userBets: UserBet[],
  bots: BotBet[],
  outcome: Outcome
): { userStake: number; payout: number; pnl: number } {
  const sum = (xs: { side: Side; stake: number }[], s: Side) =>
    xs.reduce((acc, x) => acc + (x.side === s ? x.stake : 0), 0);
  const userUp = sum(userBets, "UP");
  const userDown = sum(userBets, "DOWN");
  const totalUp = userUp + sum(bots, "UP");
  const totalDown = userDown + sum(bots, "DOWN");
  const userStake = userUp + userDown;

  if (outcome === "PUSH") return { userStake, payout: userStake, pnl: 0 };

  const userWin = outcome === "UP" ? userUp : userDown;
  const winPool = outcome === "UP" ? totalUp : totalDown;
  const losePool = outcome === "UP" ? totalDown : totalUp;
  const payout =
    userWin > 0 && winPool > 0 ? userWin + (userWin / winPool) * losePool : 0;
  return { userStake, payout, pnl: payout - userStake };
}

export function fmtPrice(p: number): string {
  return p.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function fmtCredits(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
