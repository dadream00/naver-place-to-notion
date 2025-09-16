"use client";
import { useState } from "react";
import CopyButton from "./components/CopyButton";

type Result = { data?: any; markdown?: string; error?: string; };

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <main className="min-h-screen p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-semibold">네이버 플레이스 → 노션</h1>
      <p className="text-gray-500 mt-1">스마트플레이스 URL을 넣으면 마크다운을 만들어줘요.</p>

      <form onSubmit={onSubmit} className="mt-6 flex gap-3">
        <input
          className="flex-1 border rounded-xl px-4 py-3"
          placeholder="https://m.place.naver.com/restaurant/xxxxxx"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading}
          className="rounded-xl px-5 py-3 bg-black text-white disabled:opacity-50">
          {loading ? "불러오는 중..." : "가져오기"}
        </button>
      </form>

      {result?.error && (
        <div className="mt-6 p-4 border rounded-xl text-red-600 bg-red-50">{result.error}</div>
      )}

      {result?.markdown && (
        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">미리보기</h2>
            <CopyButton text={result.markdown!} />
          </div>
          <textarea
            readOnly
            className="w-full h-64 border rounded-xl p-4 font-mono text-sm"
            value={result.markdown}
          />
          <details className="mt-2">
            <summary className="cursor-pointer text-gray-600">원본 데이터(JSON) 보기</summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded-xl overflow-x-auto text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
          <div className="text-gray-500 text-sm">
            생성된 마크다운은 <strong>그대로 노션에 붙여넣기</strong> 하면 자동 변환돼요.
          </div>
        </section>
      )}

      <footer className="mt-16 text-xs text-gray-400">
        ※ 주의: 웹사이트 규칙을 지켜요. 구조가 바뀌면 결과가 달라질 수 있어요.
      </footer>
    </main>
  );
}
