import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { requireStore } from "@/lib/store-context";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Receipt, Package } from "lucide-react";

// This dashboard depends on live data + auth; never prerender it.
export const instant = false;

export default async function DashboardPage() {
  // Opt into request-time rendering so unstable values below (new Date())
  // and the Supabase reads are "computed later" rather than prerendered.
  await connection();

  // Force first-time merchants through Create Store before showing the dashboard.
  await requireStore();

  const supabase = await createClient();
  const settings = await getSettings();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: salesToday }, { count: itemCount }] = await Promise.all([
    supabase
      .from("sales")
      .select("total_revenue,total_profit")
      .gte("created_at", startOfDay.toISOString()),
    supabase.from("items").select("id", { count: "exact", head: true }),
  ]);

  const rows = salesToday ?? [];
  const revenue = rows.reduce((s, r) => s + Number(r.total_revenue), 0);
  const profit = rows.reduce((s, r) => s + Number(r.total_profit ?? 0), 0);
  const txns = rows.length;

  const stats = [
    { label: "Revenue today", value: formatMoney(revenue, settings.currency_symbol), icon: Wallet },
    { label: "Profit today", value: formatMoney(profit, settings.currency_symbol), icon: TrendingUp },
    { label: "Transactions", value: String(txns), icon: Receipt },
    { label: "Active items", value: String(itemCount ?? 0), icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {settings.store_name} · {settings.currency_code}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
