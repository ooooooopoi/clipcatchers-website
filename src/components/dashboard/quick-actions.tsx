import Link from "next/link";
import { ArrowRight, BarChart3, LifeBuoy, PlusCircle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  {
    href: "/campaigns/new",
    icon: PlusCircle,
    title: "Create a campaign",
    detail: "Brief, assets, budget — seven guided steps.",
  },
  { href: "/files", icon: Upload, title: "Upload assets", detail: "Logos, brand kits, cut-downs." },
  { href: "/analytics", icon: BarChart3, title: "Open analytics", detail: "Views, reach, CPM by campaign." },
  { href: "/support", icon: LifeBuoy, title: "Contact support", detail: "We reply within one business day." },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {ACTIONS.map(({ href, icon: Icon, title, detail }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-all hover:border-border hover:bg-accent/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60 transition-colors group-hover:border-primary/30 group-hover:text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{title}</span>
              <span className="block truncate text-xs text-muted-foreground">{detail}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
