"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImportSummary = {
  batchId: string;
  customersCreated: number;
  customersMatched: number;
  errors: {
    field?: string;
    message: string;
    orderNumber?: string;
    rowNumber: number;
  }[];
  ordersCreated: number;
  rowsProcessed: number;
  rowsRejected: number;
  status: string;
};

export function OrdersImportForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/imports/orders", {
        body: new FormData(event.currentTarget),
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok && !payload.batchId) {
        setErrorMessage(payload.error ?? "CSV import failed.");
        setSummary(null);
        return;
      }

      setSummary(payload);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "CSV import failed.",
      );
      setSummary(null);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Orders CSV file
        <Input
          accept=".csv,text/csv"
          aria-describedby="orders-csv-help"
          name="file"
          required
          type="file"
        />
      </label>
      <p className="text-sm text-muted-foreground" id="orders-csv-help">
        Upload demo order rows only. The importer rejects duplicate order
        numbers and reports row-level validation errors.
      </p>
      <div>
        <Button disabled={isPending} type="submit">
          {isPending ? "Importing..." : "Import orders CSV"}
        </Button>
      </div>
      {errorMessage ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {summary ? (
        <section
          aria-live="polite"
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <div>
            <h2 className="font-semibold">
              {summary.status === "COMPLETED"
                ? "Import completed"
                : "Import failed"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Batch {summary.batchId}
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryItem
              label="Rows processed"
              value={summary.rowsProcessed}
            />
            <SummaryItem label="Orders created" value={summary.ordersCreated} />
            <SummaryItem
              label="Customers created"
              value={summary.customersCreated}
            />
            <SummaryItem
              label="Customers matched"
              value={summary.customersMatched}
            />
            <SummaryItem label="Rows rejected" value={summary.rowsRejected} />
            <SummaryItem label="Batch status" value={summary.status} />
          </dl>
          {summary.errors.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Row errors</h3>
              <ul className="flex max-h-48 flex-col gap-2 overflow-auto text-sm text-muted-foreground">
                {summary.errors.slice(0, 12).map((error, index) => (
                  <li key={`${error.rowNumber}-${error.field ?? "row"}-${index}`}>
                    Row {error.rowNumber}
                    {error.field ? `, ${error.field}` : ""}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </form>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

