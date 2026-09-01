"use client";

import { useAuth } from "@/lib/localAuth";
import Header from "./Header";
import Footer from "./Footer";
import LoginScreen from "./LoginScreen";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { creator, ready } = useAuth();

  if (!ready) return null; // avoids a flash of the login screen while checking localStorage

  if (!creator) return <LoginScreen />;

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
