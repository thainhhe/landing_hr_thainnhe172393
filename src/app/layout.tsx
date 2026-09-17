import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Việc Làm KCN",
  description: "Cơ hội việc làm mới mỗi ngày tại các khu công nghiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
