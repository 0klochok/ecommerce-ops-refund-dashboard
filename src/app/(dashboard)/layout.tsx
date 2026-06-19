import {
  BarChart3Icon,
  BellIcon,
  RefreshCcwIcon,
  ShoppingCartIcon,
  UploadIcon,
} from "lucide-react";
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
          <nav
            aria-label="Dashboard navigation"
            className="flex flex-wrap gap-2"
          >
            <Button asChild variant="ghost">
              <Link href="/">
                <BarChart3Icon aria-hidden="true" data-icon="inline-start" />
                Dashboard
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
            <Button asChild variant="ghost">
              <Link href="/refunds">
                <RefreshCcwIcon
                  aria-hidden="true"
                  data-icon="inline-start"
                />
                Refunds
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/imports">
                <UploadIcon aria-hidden="true" data-icon="inline-start" />
                Imports
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/alerts">
                <BellIcon aria-hidden="true" data-icon="inline-start" />
                Alerts
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
