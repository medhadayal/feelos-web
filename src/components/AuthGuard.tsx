'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        const json = await res.json().catch(() => ({ user: null }));
        if (!mounted) return;
        if (!json?.user) {
          router.replace("/login");
        } else {
          setChecking(false);
        }
      } catch {
        if (mounted) router.replace("/login");
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
