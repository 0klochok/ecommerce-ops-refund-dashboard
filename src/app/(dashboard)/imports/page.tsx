import { OrdersImportForm } from "@/app/(dashboard)/imports/orders-import-form";
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
import { formatDate } from "@/lib/domain/formatters";
import { getRecentImportBatches } from "@/server/services/imports";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ImportsPage() {
  const importBatches = await getRecentImportBatches();

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          CSV import
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Import demo orders
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Upload synthetic order CSV files into the local database. The workflow
          creates import batches, demo customers, orders, line items, payments,
          and fulfillment events without calling external systems.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Orders CSV upload</CardTitle>
            <CardDescription>
              Required columns: orderNumber, customerEmail, customerName,
              orderDate, productType, sku, itemName, quantity, unitAmountCents,
              fulfillmentStatus, paymentStatus, storeSource.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersImportForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import rules</CardTitle>
            <CardDescription>
              Demo-safe handling for repeated uploads.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Rows sharing one order number are treated as line items for the
              same order.
            </p>
            <p>
              Existing seeded order numbers are rejected and never overwritten.
            </p>
            <p>
              Money values are integer cents and dates are stored as UTC.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent import batches</CardTitle>
          <CardDescription>
            Latest seeded and uploaded demo import batches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Imported</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Rejected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.fileName}</TableCell>
                  <TableCell>{batch.status}</TableCell>
                  <TableCell>{formatDate(batch.importedAt)}</TableCell>
                  <TableCell>{batch.rowCount}</TableCell>
                  <TableCell>{batch.successCount}</TableCell>
                  <TableCell>{batch.failureCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

