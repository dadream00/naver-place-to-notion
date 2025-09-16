import { NextRequest, NextResponse } from "next/server";
import { extractBusinessFromHtml, toMarkdownBase } from "../../lib/parser";

export const dynamic = "force-dynamic";

/** 간단 GET */
async function fetchText(u: string) {
  const res = await fetch(u, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8"
    },
    redirect: "follow",
    cache: "no-store"
  });
  return res.ok ? await res.text() : "";
}

/** URL에서 placeId 추출 (모바일 URL 우선) */
function getPlaceIdFromUrl(url: string) {
  // /restaurant/12345, /place/12345 등 커버
  const m = url.match(/\/(restaurant|cafe|place)\/(\d+)/i) || url.match(/\/place\/(\d+)/i);
  return m ? (m[2] ?? m[1]) : undefined;
}

/** 정규식 유틸 */
function pickMany(re: RegExp, html: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1].trim());
  return out;
}
function stripTags(x: string) {
  return x.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** 메뉴 파싱 (대표 패턴 몇 가지) */
function parseMenuFromHtml(html: string) {
  const names = pickMany(/class="menu_name"[^>]*>([\s\S]*?)<\/[^>]+>/gim, html)
    .concat(pickMany(/class="name"[^>]*>([^<]+)</gim, html));
  const prices = pickMany(/class="price"[^>]*>([\s\S]*?)<\/[^>]+>/gim, html)
    .concat(pickMany(/class="cost"[^>]*>([^<]+)</gim, html));
  const items = names.map((n, i) => ({
    name: stripTags(n),
    price: prices[i] ? stripTags(prices[i]) : undefined
  })).filter(x => x.name);
  return items;
}

/** 리뷰 파싱 (텍스트만 일부) */
function parseReviewsFromHtml(html: string) {
  const texts = pickMany(/class="(?:review_text|text|desc)">([\s\S]*?)<\/[^>]+>/gim, html)
    .map(stripTags)
    .filter(Boolean);
  return texts.slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "유효한 URL을 보내주세요." }, { status: 400 });
    }
    // 네이버만 허용 (원하면 지워도 됨)
    try {
      const u = new URL(url);
      if (!/(naver\.com)$/i.test(u.hostname)) {
        return NextResponse.json({ error: "네이버 스마트플레이스 URL을 입력해주세요." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "URL 형식이 올바르지 않습니다." }, { status: 400 });
    }

    // 기본 HTML (여기서 JSON-LD/og 등 뽑음)
    const html = await fetchText(url);
    if (!html) {
      return NextResponse.json({ error: "페이지 로드 실패" }, { status: 500 });
    }

    const biz = extractBusinessFromHtml(html, url);

    // --- 메뉴/리뷰 추가 수집 (모바일 URL 권장) ---
    const placeId = getPlaceIdFromUrl(url);
    let menus: Array<{ name: string; price?: string }> = [];
    let reviews: string[] = [];

    if (placeId) {
      const menuHtml = await fetchText(`https://m.place.naver.com/restaurant/${placeId}/menu/list`);
      if (menuHtml) menus = parseMenuFromHtml(menuHtml);

      const rv1 = await fetchText(`https://m.place.naver.com/restaurant/${placeId}/review/visitor`);
      const rv2 = await fetchText(`https://m.place.naver.com/restaurant/${placeId}/review/ugc`);
      reviews = [...parseReviewsFromHtml(rv1 || ""), ...parseReviewsFromHtml(rv2 || "")];
    }

    const markdown =
      toMarkdownBase(biz) +
      (menus.length ? ("\n\n## 메뉴\n" + menus.map(m => `- ${m.name}${m.price ? ` — ${m.price}` : ""}`).join("\n")) : "") +
      (reviews.length ? ("\n\n## 리뷰 (일부)\n" + reviews.map(r => `- ${r}`).join("\n")) : "");

    return NextResponse.json({ data: { ...biz, menus, reviews }, markdown });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
