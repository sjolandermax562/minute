import { NextResponse } from "next/server";

const FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const HERMES_LATEST = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${FEED_ID}`;

interface HermesParsed {
  price: { price: string; conf: string; expo: number; publish_time: number };
  metadata?: { slot?: number };
}

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(HERMES_LATEST, { next: { revalidate: 5 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "HERMES UPSTREAM FAILURE", status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    const p: HermesParsed | undefined = data?.parsed?.[0];
    if (!p || !p.price) {
      return NextResponse.json(
        { error: "HERMES RETURNED NO PARSED PRICE" },
        { status: 502 }
      );
    }
    const scale = Math.pow(10, p.price.expo);
    return NextResponse.json({
      price: Number(p.price.price) * scale,
      conf: Number(p.price.conf) * scale,
      publishTime: p.price.publish_time,
      slot: p.metadata?.slot ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "HERMES UNREACHABLE" },
      { status: 502 }
    );
  }
}
