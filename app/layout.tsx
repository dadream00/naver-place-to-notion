import "./globals.css";

export const metadata = {
  title: "네이버 플레이스 → 노션",
  description: "스마트플레이스 URL에서 정보 추출해 마크다운 생성",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
