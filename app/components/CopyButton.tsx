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
    <button onClick={onCopy} className="rounded-2xl px-4 py-2 border shadow-sm hover:shadow transition">
      {ok === true ? "복사 완료!" : ok === false ? "복사 실패" : "마크다운 복사"}
    </button>
  );
}
