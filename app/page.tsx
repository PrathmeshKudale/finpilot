"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFin } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const onboarded = useFin((s) => s.onboarded);
  useEffect(() => {
    router.replace(onboarded ? "/dashboard" : "/onboarding");
  }, [onboarded, router]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-mute text-sm">
      Opening FinPilot…
    </div>
  );
}
