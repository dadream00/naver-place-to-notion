import { NextRequest, NextResponse } from "next/server";
import { extractBusinessFromHtml, toMarkdown } from "../../lib/parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "유효한 URL을 보내주세요." }, { status: 400 });
    }

    // 네이버 도메인만 허용(원하면 지워도 돼요)
    try {
      const u = new URL(url);
      if (!/(naver\.com)$/i.test(u.hostname)) {
        return NextResponse.json({ error: "네이버 스마트플레이스 URL을 입력해주세요." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "URL 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      redirect: "follow",
      cache: "no-store"
    });

    if (!res.ok) {
      return NextResponse.json({ error: `페이지 로드 실패 (${res.status})` }, { status: 500 });
    }

    const html = await res.text();
    const biz = extractBusinessFromHtml(html, url);
    const markdown = toMarkdown(biz);

    return NextResponse.json({ data: biz, markdown });
  } catch (e) {
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
