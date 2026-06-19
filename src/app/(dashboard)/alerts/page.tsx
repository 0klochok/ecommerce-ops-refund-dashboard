import Link from "next/link";
import { RecalculateAlertsButton } from "@/app/(dashboard)/alerts/recalculate-alerts-button";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  alertSeverityLabels,
  alertStatusLabels,
  alertTypeLabels,
  type AlertSeverityValue,
  type AlertStatusValue,
  type AlertTypeValue,
} from "@/lib/domain/alerts";
import { formatDate } from "@/lib/domain/formatters";
import { readAlertList } from "@/server/repositories/alerts-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AlertsPageProps = {
  searchParams?: Promise<{
    severity?: string;
    status?: string;
  }>;
};

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const filters = (await searchParams) ?? {};
  const alerts = await readAlertList(filters);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Alerts</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Operational alerts
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Delayed fulfillment, high refund amount, and repeated failed payment
            alerts generated from local demo data.
          </p>
        </div>
        <RecalculateAlertsButton />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow by status or severity without changing alert state.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <FilterLinks
            currentValue={filters.status ?? "all"}
            label="Status"
            param="status"
            values={["all", "OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"]}
          />
          <FilterLinks
            currentValue={filters.severity ?? "all"}
            label="Severity"
            param="severity"
            values={["all", "LOW", "MEDIUM", "HIGH", "CRITICAL"]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert list</CardTitle>
          <CardDescription>
            {alerts.length.toLocaleString("en-US")} matching demo alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[72rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Related record</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    {alertTypeLabels[alert.type as AlertTypeValue]}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={
                        alertSeverityLabels[alert.severity as AlertSeverityValue]
                      }
                      tone={getSeverityTone(alert.severity)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={alertStatusLabels[alert.status as AlertStatusValue]}
                      tone={alert.status === "OPEN" ? "warning" : "neutral"}
                    />
                  </TableCell>
                  <TableCell>
                    <RelatedRecord alert={alert} />
                  </TableCell>
                  <TableCell>{formatDate(alert.createdAt)}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{alert.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {alert.description}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function FilterLinks({
  currentValue,
  label,
  param,
  values,
}: {
  currentValue: string;
  label: string;
  param: "severity" | "status";
  values: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-16 text-sm font-medium">{label}</span>
      {values.map((value) => (
        <Button
          asChild
          key={value}
          size="sm"
          variant={currentValue === value ? "secondary" : "outline"}
        >
          <Link href={value === "all" ? "/alerts" : `/alerts?${param}=${value}`}>
            {value === "all" ? "All" : formatEnumLabel(value)}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function RelatedRecord({
  alert,
}: {
  alert: Awaited<ReturnType<typeof readAlertList>>[number];
}) {
  if (alert.order) {
    return (
      <Link
        className="font-medium underline-offset-4 hover:underline"
        href={`/orders/${alert.order.id}`}
      >
        {alert.order.orderNumber}
      </Link>
    );
  }

  if (alert.customer) {
    return (
      <Link
        className="font-medium underline-offset-4 hover:underline"
        href={`/customers/${alert.customer.id}`}
      >
        {alert.customer.firstName} {alert.customer.lastName}
      </Link>
    );
  }

  if (alert.payment) {
    return alert.payment.providerPaymentId;
  }

  if (alert.refund) {
    return alert.refund.providerRefundId;
  }

  return "No related record";
}

function getSeverityTone(value: string) {
  if (value === "CRITICAL") {
    return "danger" as const;
  }

  if (value === "HIGH" || value === "MEDIUM") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

