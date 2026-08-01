import type { Metadata } from "next";
import { CreditCard, Download, Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlanSelector } from "@/components/billing/plan-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { INVOICE_STATUS_META, PLAN_META } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const sessionUser = await requireUser();

  const [user, invoices, paymentMethods, paidTotal] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id } }),
    prisma.invoice.findMany({ where: { userId: sessionUser.id }, orderBy: { issuedAt: "desc" } }),
    prisma.paymentMethod.findMany({
      where: { userId: sessionUser.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.invoice.aggregate({
      where: { userId: sessionUser.id, status: "PAID" },
      _sum: { amountCents: true },
    }),
  ]);

  const plan = user?.plan ?? "STARTER";
  const outstanding = invoices
    .filter((i) => i.status === "OPEN")
    .reduce((sum, i) => sum + i.amountCents, 0);

  return (
    <div>
      <PageHeader title="Billing" description="Your plan, invoices and payment methods." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="mt-2 text-2xl font-semibold">{PLAN_META[plan].label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(PLAN_META[plan].priceCents)}/month
            {user?.planRenewsAt ? ` · renews ${formatDate(user.planRenewsAt)}` : ""}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{formatCurrency(outstanding)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {invoices.filter((i) => i.status === "OPEN").length} open invoice(s)
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Paid to date</p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {formatCurrency(paidTotal._sum.amountCents ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            across {invoices.filter((i) => i.status === "PAID").length} invoice(s)
          </p>
        </Card>
      </div>

      <h2 className="mb-4 mt-8 text-lg font-semibold tracking-tight">Plans</h2>
      <PlanSelector current={plan} />

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invoices</CardTitle>
            <CardDescription>Every invoice issued to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description="Invoices appear here once your first campaign is approved."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const meta = INVOICE_STATUS_META[invoice.status];
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <p className="font-mono text-sm font-medium">{invoice.number}</p>
                          <p className="text-xs text-muted-foreground">{invoice.description}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(invoice.issuedAt)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              meta.className,
                            )}
                          >
                            {meta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(invoice.amountCents, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.hostedUrl ? (
                            <Button asChild variant="ghost" size="sm">
                              <a href={invoice.hostedUrl} target="_blank" rel="noopener noreferrer">
                                <Download />
                                PDF
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment methods</CardTitle>
            <CardDescription>Cards on file for your subscription.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No payment method saved yet.
              </p>
            ) : (
              paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                >
                  <span className="flex h-9 w-12 items-center justify-center rounded border border-border bg-background/60 text-[10px] font-semibold uppercase">
                    {method.brand}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm">•••• {method.last4}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                    </p>
                  </div>
                  {method.isDefault && <Badge variant="default">Default</Badge>}
                </div>
              ))
            )}

            <Button variant="outline" className="w-full" disabled={!process.env.STRIPE_SECRET_KEY}>
              <CreditCard />
              {process.env.STRIPE_SECRET_KEY ? "Add payment method" : "Connect Stripe to add cards"}
            </Button>
            {!process.env.STRIPE_SECRET_KEY && (
              <p className="text-xs text-muted-foreground">
                Set <code className="font-mono">STRIPE_SECRET_KEY</code> to enable card management
                and hosted checkout.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
