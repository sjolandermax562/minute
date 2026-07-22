import { NextRequest, NextResponse } from "next/server";

const FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

interface HermesParsed {
  price: { price: string; conf: string; expo: number; publish_time: number };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const raw = req.nextUrl.searchParams.get("t");
  if (!raw || !/^\d{9,11}$/.test(raw)) {
    return NextResponse.json(
      { error: "BAD PARAM: t MUST BE UNIX SECONDS" },
      { status: 400 }
    );
  }
  const t = parseInt(raw, 10);
  const nowSec = Math.floor(Date.now() / 1000);
  // sane window: after 2021-01-01, not beyond the current minute
  if (t < 1609459200 || t > nowSec + 60) {
    return NextResponse.json(
      { error: "BAD PARAM: t OUT OF RANGE" },
      { status: 400 }
    );
  }

  try {
    // Historical prints are immutable. Cache hard.
    const res = await fetch(
      `https://hermes.pyth.network/v2/updates/price/${t}?ids[]=${FEED_ID}`,
      { next: { revalidate: 3600 } }
    );
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
      t,
      price: Number(p.price.price) * scale,
      conf: Number(p.price.conf) * scale,
      publishTime: p.price.publish_time,
    });
  } catch {
    return NextResponse.json(
      { error: "HERMES UNREACHABLE" },
      { status: 502 }
    );
  }
}
