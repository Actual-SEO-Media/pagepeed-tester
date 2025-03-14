export const metadata = {
  title: "PageSpeed Insights Bulk Tester",
  description: "Test multiple URLs with PageSpeed Insights API simultaneously",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
