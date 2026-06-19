import { OrdersTable } from "@/components/orders/orders-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrderTableRows } from "@/server/services/orders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const orders = await getOrderTableRows();

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Orders workflow
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Orders queue
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Customer, fulfillment, payment, refund, and source context from seeded
          demo data.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Order operations table</CardTitle>
          <CardDescription>
            Recent seeded demo orders organized for operational review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable rows={orders} />
        </CardContent>
      </Card>
    </main>
  );
}
