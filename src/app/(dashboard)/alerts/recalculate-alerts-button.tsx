"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type RecalculateSummary = {
  created: number;
  evaluated: number;
  skippedExisting: number;
};

export function RecalculateAlertsButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [summary, setSummary] = useState<RecalculateSummary | null>(null);

  async function recalculate() {
    setIsPending(true);

    try {
      const response = await fetch("/api/alerts/recalculate", {
        method: "POST",
      });
      const payload = await response.json();

      setSummary(payload);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={isPending} onClick={recalculate} type="button">
        {isPending ? "Recalculating..." : "Recalculate alerts"}
      </Button>
      {summary ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Recalculated alerts: {summary.created} created,{" "}
          {summary.skippedExisting} skipped existing, {summary.evaluated}{" "}
          evaluated.
        </p>
      ) : null}
    </div>
  );
}

