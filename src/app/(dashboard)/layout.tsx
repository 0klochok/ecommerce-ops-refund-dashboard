import { BarChart3Icon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link className="flex flex-col gap-1" href="/">
            <span className="text-sm font-medium text-muted-foreground">
              Demo operations
            </span>
            <span className="text-lg font-semibold">
              E-commerce Ops Refund Dashboard
            </span>
          </Link>
          <nav aria-label="Dashboard navigation" className="flex gap-2">
            <Button asChild variant="ghost">
              <Link href="/">
                <BarChart3Icon aria-hidden="true" data-icon="inline-start" />
                Overview
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/orders">
                <ShoppingCartIcon
                  aria-hidden="true"
                  data-icon="inline-start"
                />
                Orders
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
