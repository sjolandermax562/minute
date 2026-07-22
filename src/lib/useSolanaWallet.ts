"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal shape of an injected Solana provider (Phantom / Solflare / Backpack).
// Connection only. No signing, no transactions.
export interface SolanaProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey: { toBase58(): string } | null;
  connect(opts?: {
    onlyIfTrusted?: boolean;
  }): Promise<{ publicKey: { toBase58(): string } } | void>;
  disconnect(): Promise<void>;
  on(event: string, cb: (...args: unknown[]) => void): void;
  off?(event: string, cb: (...args: unknown[]) => void): void;
  removeListener?(event: string, cb: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
  }
}

export function truncateAddress(base58: string): string {
  if (base58.length <= 9) return base58;
  return `${base58.slice(0, 4)}…${base58.slice(-4)}`;
}

function detectProvider(): { provider: SolanaProvider; name: string } | null {
  if (typeof window === "undefined") return null;
  const w = window;
  // Prefer Phantom when several wallets are injected.
  if (w.solana?.isPhantom) return { provider: w.solana, name: "PHANTOM" };
  if (w.solana) return { provider: w.solana, name: "SOLANA" };
  if (w.solflare) return { provider: w.solflare, name: "SOLFLARE" };
  if (w.backpack) return { provider: w.backpack, name: "BACKPACK" };
  return null;
}

export interface SolanaWallet {
  available: boolean;
  providerName: string | null;
  address: string | null;
  connecting: boolean;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
}

export function useSolanaWallet(): SolanaWallet {
  const [available, setAvailable] = useState(false);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const providerRef = useRef<SolanaProvider | null>(null);

  useEffect(() => {
    const found = detectProvider();
    if (!found) return;
    providerRef.current = found.provider;
    setAvailable(true);
    setProviderName(found.name);

    const onAccountChanged = (pk: unknown) => {
      const key = pk as { toBase58(): string } | null;
      setAddress(key ? key.toBase58() : null);
    };
    const onDisconnect = () => setAddress(null);

    found.provider.on("accountChanged", onAccountChanged);
    found.provider.on("disconnect", onDisconnect);

    // Silent reconnect on revisit if the site is already trusted.
    Promise.resolve(found.provider.connect({ onlyIfTrusted: true }))
      .then((res) => {
        const key = res?.publicKey ?? found.provider.publicKey;
        if (key) setAddress(key.toBase58());
      })
      .catch(() => {
        /* not trusted yet. user connects manually. */
      });

    return () => {
      const p = providerRef.current;
      if (!p) return;
      if (p.removeListener) {
        p.removeListener("accountChanged", onAccountChanged);
        p.removeListener("disconnect", onDisconnect);
      } else if (p.off) {
        p.off("accountChanged", onAccountChanged);
        p.off("disconnect", onDisconnect);
      }
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    const p = providerRef.current;
    if (!p) return null;
    setConnecting(true);
    try {
      const res = await p.connect();
      const key =
        (res as { publicKey?: { toBase58(): string } } | void)?.publicKey ??
        p.publicKey;
      const addr = key ? key.toBase58() : null;
      setAddress(addr);
      return addr;
    } catch {
      return null; // user rejected the prompt
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const p = providerRef.current;
    if (p) {
      try {
        await p.disconnect();
      } catch {
        /* provider refused. clear locally anyway. */
      }
    }
    setAddress(null);
  }, []);

  return { available, providerName, address, connecting, connect, disconnect };
}
