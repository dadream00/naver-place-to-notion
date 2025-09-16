"use client";
import { useState } from "react";
import CopyButton from "./components/CopyButton";

type Result = {
  data?: any;
  markdown?: string;
  error?: string;
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      setResult(json);
    } catch {
      setResult({ error: "요청 실패" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-hero py-10 md:py-16">
      {/* 헤더 */}
      <section className="text-center space-y-3 mb-8">
        <div className="badge mx-auto">🚀 네이버 플레이스 → 노션</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          URL 한 번으로 <span className="text-brand-700">마크다운</span> 완성
        </h1>
        <p className="text-gray-600">
          <b>모바일 플레이스 URL</b>을 붙여넣고 버튼만 누르세요. (예: https://m.place.naver.com/restaurant/12345)
        </p>
      </section>

      {/* 입력 */}
      <section className="card p-5 md:p-6">
        <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3">
          <input
            className="input"
            placeholder="https://m.place.naver.com/restaurant/12345"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "불러오는 중…" : "가져오기"}
          </button>
        </form>

        {result?.error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 p-4">
            {result.error}
          </div>
        )}
      </section>

      {/* 결과 */}
      {result?.markdown && (
        <section className="card mt-6 p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">미리보기</h2>
            <CopyButton text={result.markdown!} />
          </div>
          <textarea readOnly className="codebox" value={result.markdown} />
          <details className="rounded-xl border p-4 open:bg-gray-50">
            <summary className="cursor-pointer text-gray-700">원본 데이터(JSON) 보기</summary>
            <pre className="mt-2 overflow-x-auto text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
          <p className="text-sm text-gray-500">
            생성된 텍스트를 그대로 <b>노션에 붙여넣기</b> 하면 자동 변환됩니다.
          </p>
        </section>
      )}

      <footer className="text-center text-xs text-gray-500 mt-10">
        ※ 웹사이트 약관/로봇정책을 준수하세요. 구조가 바뀌면 결과가 달라질 수 있습니다.
      </footer>
    </main>
  );
}
