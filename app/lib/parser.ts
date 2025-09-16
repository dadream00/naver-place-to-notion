type Hours = { day: string; open?: string; close?: string; note?: string };
export type Biz = {
  name?: string;
  category?: string;
  phone?: string;
  address?: string;
  roadAddress?: string;
  homepage?: string;
  rating?: string;
  reviewCount?: string;
  images?: string[];
  coordinates?: { lat?: number; lng?: number };
  hours?: Hours[];
  sourceUrl: string;
  rawLd?: any;
};

function safeJsonParse<T = any>(s: string | null): T | undefined {
  if (!s) return;
  try { return JSON.parse(s) as T; } catch { return; }
}

function dig(obj: any, keys: string[]): any {
  try { return keys.reduce((o, k) => o?.[k], obj); } catch { return undefined; }
}
function normalizeHours(v: any): Hours[] | undefined {
  if (!v) return;
  const arr = Array.isArray(v) ? v : [v];
  return arr.map((h: any) => ({
    day: (Array.isArray(h?.dayOfWeek) ? h.dayOfWeek[0] : h?.dayOfWeek)?.toString()?.split("/").pop() ?? "-",
    open: h?.opens, close: h?.closes
  }));
}

/** JSON-LD에서 필수 값 꺼내기 (여러 형태 보강) */
function fromJsonLd(ld: any): Partial<Biz> {
  if (!ld) return {};
  const obj = Array.isArray(ld)
    ? ld.find((x) => x?.["@type"]?.includes?.("LocalBusiness") || x?.["@type"] === "LocalBusiness") ?? ld[0]
    : ld;

  const name = obj?.name ?? dig(obj, ["item", "name"]);
  const category = obj?.["@type"] ?? dig(obj, ["item", "@type"]);
  const phone = obj?.telephone ?? dig(obj, ["contactPoint", "telephone"]);

  const addressObj = obj?.address ?? dig(obj, ["item", "address"]);
  const address =
    addressObj
      ? [addressObj?.addressCountry, addressObj?.addressRegion, addressObj?.addressLocality, addressObj?.streetAddress]
          .filter(Boolean).join(" ")
      : undefined;
  const roadAddress = addressObj?.streetAddress;

  const homepage = obj?.url ?? obj?.sameAs;

  const rating =
    obj?.aggregateRating?.ratingValue?.toString() ??
    dig(obj, ["review", "aggregateRating", "ratingValue"])?.toString();
  const reviewCount =
    obj?.aggregateRating?.reviewCount?.toString() ??
    dig(obj, ["review", "aggregateRating", "reviewCount"])?.toString();

  const images = (obj?.image && Array.isArray(obj.image) ? obj.image : obj.image ? [obj.image] : []) as string[];

  const geo = obj?.geo ?? dig(obj, ["geo", "0"]) ?? dig(obj, ["location", "geo"]);
  const coordinates = geo ? { lat: Number(geo.latitude), lng: Number(geo.longitude) } : undefined;

  const hours = normalizeHours(
    obj?.openingHoursSpecification ?? obj?.openingHours ?? dig(obj, ["hours"])
  );

  return { name, category, phone, address, roadAddress, homepage, rating, reviewCount, images, coordinates, hours, rawLd: obj };
}

/** 메타태그 보조 */
function matchOne(re: RegExp, html: string) {
  return html.match(re)?.[1];
}

export function extractBusinessFromHtml(html: string, sourceUrl: string): Biz {
  // 1) JSON-LD
  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  const ld = safeJsonParse<any>(ldMatch?.[1] ?? null);
  const fromLd = fromJsonLd(ld);

  // 2) og/meta 보강
  const ogTitle = matchOne(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i, html);
  const ogDesc  = matchOne(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i, html);
  const ogImage = matchOne(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i, html);

  const merged: Biz = { sourceUrl, ...fromLd };

  if (!merged.name && ogTitle) merged.name = ogTitle.replace(/\s*:\s*네이버\s*플레이스?$/i, "");
  if ((!merged.images || merged.images.length === 0) && ogImage) merged.images = [ogImage];

  if (!merged.phone) {
    const tel = matchOne(/tel:\s*([0-9\-+\s]+)/i, html);
    if (tel) merged.phone = tel.trim();
  }
  if (!merged.address && ogDesc) {
    merged.address = ogDesc.split(/\s{2,}|\n/)[0]?.trim();
  }
  return merged;
}

/** 노션 붙여넣기용 기본 마크다운 */
export function toMarkdownBase(b: Biz): string {
  const lines: string[] = [];
  lines.push(`# ${b.name ?? "업체명"}`);
  const badge = [b.category, b.rating ? `⭐ ${b.rating} (${b.reviewCount ?? "0"})` : undefined]
    .filter(Boolean).join(" · ");
  if (badge) lines.push(`*${badge}*`);
  lines.push("");
  lines.push(`**주소**: ${b.roadAddress ?? b.address ?? "-"}`);
  lines.push(`**전화**: ${b.phone ?? "-"}`);
  lines.push(`**홈페이지**: ${b.homepage ?? "-"}`);
  if (b.coordinates?.lat && b.coordinates?.lng) lines.push(`**좌표**: ${b.coordinates.lat}, ${b.coordinates.lng}`);
  lines.push("");
  if (b.hours && b.hours.length) {
    lines.push("## 영업시간");
    b.hours.forEach((h) => lines.push(`- ${h.day}: ${h.open ?? "-"} ~ ${h.close ?? "-"}`));
    lines.push("");
  }
  if (b.images?.length) {
    lines.push("## 사진");
    b.images.slice(0, 3).forEach((src) => lines.push(`![](${src})`));
    lines.push("");
  }
  lines.push("---");
  lines.push(`출처: ${b.sourceUrl}`);
  return lines.join("\n");
}
