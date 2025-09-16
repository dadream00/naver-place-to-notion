"use client";
import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState<null | boolean>(null);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(null), 1500);
    } catch {
      setOk(false);
      setTimeout(() => setOk(null), 1500);
    }
  };

  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-700 hover:shadow-sm active:scale-[0.99] transition"
      title="클립보드로 복사"
    >
      {ok === true ? "✅ 복사 완료" : ok === false ? "❌ 복사 실패" : "📋 마크다운 복사"}
    </button>
  );
}
