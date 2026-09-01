import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdminModeProvider } from "@/lib/adminMode";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pixory Creator Community Resource Hub",
  description: "Pixory Breakthrough Creator Resource Hub",
};

// Runs before paint so the theme toggle doesn't flash light-then-dark on load.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("pixory-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <AdminModeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AdminModeProvider>
      </body>
    </html>
  );
}
