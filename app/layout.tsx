export const metadata = {
  title: "네이버 플레이스 → 노션",
  description: "스마트플레이스 URL을 넣으면 마크다운을 만들어줘요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "ui-sans-serif, system-ui, Apple SD Gothic Neo, Malgun Gothic, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
