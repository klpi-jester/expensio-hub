"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  ListChecks,
  Package,
  Tags,
  BarChart3,
  Store,
  QrCode,
  Settings as SettingsIcon,
} from "lucide-react";

const nav = [
  { href: "/admin/pos", label: "POS Terminal", icon: ShoppingCart },
  { href: "/admin/queue", label: "Active Reservations", icon: ListChecks },
  { href: "/admin/items", label: "Inventory", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/dashboard", label: "Reports", icon: BarChart3 },
  { href: "/admin/store", label: "My Store", icon: Store },
  { href: "/admin/menu-qr", label: "Menu QR", icon: QrCode },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function AdminNav({ storeName }: { storeName: string }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-lg font-bold tracking-tight">{storeName}</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
