import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CustomerNotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Customer not found</CardTitle>
          <CardDescription>
            The requested demo customer is not available in the local dataset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/orders">Back to orders</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

