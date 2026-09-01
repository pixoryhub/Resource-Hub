import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";
import { AdminModeProvider } from "@/lib/adminMode";
import { AuthProvider } from "@/lib/localAuth";
import AppShell from "@/components/AppShell";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// A warm, soft-contrast serif used sparingly for headlines only — gives the
// hub a distinct editorial voice instead of reading as another sans-only
// app template. Everything else (nav, body, buttons, forms) stays Poppins.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
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
    <html
      lang="en"
      className={`${poppins.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">
        <AdminModeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </AdminModeProvider>
      </body>
    </html>
  );
}
