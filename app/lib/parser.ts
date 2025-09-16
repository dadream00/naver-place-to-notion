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

function fromJsonLd(ld: any): Partial<Biz> {
  if (!ld) return {};
  const obj = Array.isArray(ld)
    ? ld.find((x) => x["@type"]?.includes?.("LocalBusiness") || x["@type"] === "LocalBusiness") ?? ld[0]
    : ld;

  const name = obj?.name;
  const category = obj?.["@type"];
  const phone = obj?.telephone;
  const addressObj = obj?.address;
  const address =
    addressObj?.addressCountry || addressObj?.addressRegion || addressObj?.addressLocality || addressObj?.streetAddress
      ? [addressObj?.addressCountry, addressObj?.addressRegion, addressObj?.addressLocality, addressObj?.streetAddress]
          .filter(Boolean).join(" ")
      : undefined;

  const roadAddress = addressObj?.streetAddress;
  const homepage = obj?.url;
  const rating = obj?.aggregateRating?.ratingValue?.toString();
  const reviewCount = obj?.aggregateRating?.reviewCount?.toString();
  const images = (obj?.image && Array.isArray(obj.image) ? obj.image : obj.image ? [obj.image] : []) as string[];
  const coordinates = obj?.geo ? { lat: Number(obj.geo.latitude), lng: Number(obj.geo.longitude) } : undefined;

  const hours: Hours[] | undefined = Array.isArray(obj?.openingHoursSpecification)
    ? obj.openingHoursSpecification.map((h: any) => ({
        day: h?.dayOfWeek?.toString()?.replace("http://schema.org/", "") ?? "-",
        open: h?.opens, close: h?.closes
      }))
    : undefined;

  return { name, category, phone, address, roadAddress, homepage, rating, reviewCount, images, coordinates, hours, rawLd: obj };
}

export function extractBusinessFromHtml(html: string, sourceUrl: string) {
  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  const ld = safeJsonParse<any>(ldMatch?.[1] ?? null);

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const ogDesc  = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

  const fromLd = fromJsonLd(ld);
  const merged: Biz = { sourceUrl, ...fromLd };

  if (!merged.name && ogTitle) merged.name = ogTitle.replace(/\s*:\s*네이버\s*플레이스?$/i, "");
  if ((!merged.images || merged.images.length === 0) && ogImage) merged.images = [ogImage];

  if (!merged.phone) {
    const tel = html.match(/tel:\s*([0-9\-+\s]+)/i)?.[1]?.trim();
    if (tel) merged.phone = tel;
  }
  if (!merged.address && ogDesc) {
    merged.address = ogDesc.split(/\s{2,}|\n/)[0]?.trim();
  }
  return merged;
}

export function toMarkdown(b: Biz): string {
  const lines: string[] = [];
  lines.push(`# ${b.name ?? "업체명"}`);
  const badge = [b.category, b.rating ? `⭐ ${b.rating} (${b.reviewCount ?? "0"})` : undefined].filter(Boolean).join(" · ");
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
