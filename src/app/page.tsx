import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  UtensilsCrossed,
  ArrowRight,
  Rocket,
  LayoutGrid,
  List,
  Smartphone,
  QrCode,
  ChefHat,
  Activity,
  BarChart3,
  Boxes,
  Check,
  Sparkles,
  Globe,
  AtSign,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Expensio Hub | All-in-One POS & QR Self-Ordering Platform",
  description:
    "Streamline your retail and restaurant operations with Expensio Hub. Free cloud POS, digital QR menus, realtime kitchen queue, and smart inventory management.",
  alternates: { canonical: "/" },
  keywords: [
    "cloud POS",
    "restaurant POS",
    "QR menu",
    "self-ordering",
    "inventory management",
    "point of sale",
    "kitchen queue",
  ],
  openGraph: {
    type: "website",
    url: "https://pos.expensio.com",
    siteName: "Expensio Hub",
    title: "Expensio Hub | All-in-One POS & QR Self-Ordering Platform",
    description:
      "Free cloud POS, digital QR menus, realtime kitchen queue, and smart inventory management for retail and restaurants.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "Expensio Hub — POS and QR self-ordering platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Expensio Hub | All-in-One POS & QR Self-Ordering Platform",
    description:
      "Free cloud POS, digital QR menus, realtime kitchen queue, and smart inventory management.",
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
  },
  robots: { index: true, follow: true },
};

// Resolve demo stores at request time (avoids build-time DB access).
export const instant = false;

const SITE = "https://pos.expensio.com";
const DEMO_SLUGS = ["jester-grill", "brew-and-bake", "ramen-house"];

type DemoStore = {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
};

// Curated high-res food imagery (Unsplash CDN) for the hero mockup.
const FOOD_IMG = {
  truffleBurger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  baconBurger:
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
  icedLatte:
    "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
  gyoza:
    "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80",
  ramen:
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
  croissant:
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
};

// Fallback demo cards so the section renders vibrant imagery even before seed.sql runs.
const CURATED_DEMOS: DemoStore[] = [
  {
    slug: "jester-grill",
    name: "Jester’s Artisanal Grill",
    description: "Gourmet handcrafted burgers, sizzlers, and premium sides.",
    logo_url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=200&q=80",
    cover_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "brew-and-bake",
    name: "Brew & Bake Cafe",
    description: "Specialty espresso beverages, fresh croissants, and daily pastries.",
    logo_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=200&q=80",
    cover_url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "ramen-house",
    name: "Nori & Broth Ramen Den",
    description: "Authentic slow-simmered tonkotsu ramen and Japanese tapas.",
    logo_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=200&q=80",
    cover_url: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=800&q=80",
  },
];

// Prefer live DB stores; backfill imagery (and whole cards pre-seed) from curated data.
function enrichDemos(stores: DemoStore[]): DemoStore[] {
  if (stores.length === 0) return CURATED_DEMOS;
  return stores.map((s) => {
    const c = CURATED_DEMOS.find((x) => x.slug === s.slug);
    return c
      ? { ...s, cover_url: s.cover_url ?? c.cover_url, logo_url: s.logo_url ?? c.logo_url }
      : s;
  });
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Expensio Hub",
      url: SITE,
      logo: `${SITE}/logo.png`,
      sameAs: [
        "https://twitter.com/expensiohub",
        "https://github.com/expensio-hub",
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@expensio.com",
          availableLanguage: ["English"],
        },
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#app`,
      name: "Expensio Hub",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Point of Sale",
      description:
        "All-in-one cloud POS and QR self-ordering platform for retail and restaurants with live kitchen queue and profit analytics.",
      url: SITE,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to get started",
      },
      featureList: [
        "Dual-mode Retail & Resto POS",
        "QR code self-ordering",
        "Realtime kitchen queue",
        "Inventory & profit analytics",
      ],
    },
  ],
};

const features = [
  {
    icon: LayoutGrid,
    title: "Dual Mode — Retail & Resto",
    body: "Switch instantly between a fast item-list checkout and a category-based restaurant grid, all in one terminal.",
    points: ["Barcode/list speed", "Visual resto grid"],
  },
  {
    icon: QrCode,
    title: "QR Code Self-Ordering",
    body: "Guests scan a table QR code, browse your live digital menu and order straight to the kitchen — zero app downloads required.",
    points: ["Table tracking", "No app install"],
  },
  {
    icon: ChefHat,
    title: "Live Kitchen Queue",
    body: "Powered by Supabase Realtime, incoming guest orders land in your queue the moment they’re placed — no refreshing.",
    points: ["Realtime sync", "Status tracking"],
  },
  {
    icon: BarChart3,
    title: "Inventory & Profit Analytics",
    body: "Auto-calculated profit margins (Sell Price minus Buy Price), low-stock alerts, and category revenue breakdowns.",
    points: ["Margin per item", "Category reports"],
  },
];

const faqs = [
  {
    q: "Is Expensio Hub really free?",
    a: "Yes. You can start the full cloud POS, QR menus and kitchen queue for free — no credit card required.",
  },
  {
    q: "Do my customers need to download an app?",
    a: "No. Guests simply scan a QR code at the table and order from a mobile-friendly web menu in their browser.",
  },
  {
    q: "Can I manage retail and a restaurant at the same time?",
    a: "Absolutely. The POS switches between Retail (list/barcode) and Resto (category grid) modes instantly.",
  },
  {
    q: "How is profit calculated?",
    a: "Every sale compares Sell Price minus Buy Price automatically, so you see margin per item and per category.",
  },
];

async function loadDemoStores(): Promise<DemoStore[]> {
  const supabase = await createClient();
  const cols = "slug,name,description,logo_url,cover_url";

  const { data } = await supabase
    .from("stores")
    .select(cols)
    .in("slug", DEMO_SLUGS)
    .order("slug");

  if (data && data.length > 0) return data as DemoStore[];

  // Fallback: show whatever stores exist (useful before the seed runs).
  const { data: anyStores } = await supabase
    .from("stores")
    .select(cols)
    .order("created_at", { ascending: true })
    .limit(3);

  return (anyStores ?? []) as DemoStore[];
}

export default async function Home() {
  await connection();
  const demoStores = enrichDemos(await loadDemoStores());

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== Header / Navbar ===== */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            Expensio Hub
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#demo" className="transition-colors hover:text-foreground">Demo Stores</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/login">
                Open Merchant POS
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-10 top-40 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-sm">
              <Rocket className="h-3.5 w-3.5 text-primary" />
              Free Cloud POS &amp; QR Ordering Platform
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Empower Your Restaurant &amp; Retail Business with{" "}
              <span className="text-primary">Next-Gen POS</span>
            </h1>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">
              All-in-one system with fast cashier checkout, live guest QR
              ordering, inventory tracking, and profit reports.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/auth/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#demo">Explore Demo Stores</a>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              {["No credit card", "Realtime kitchen queue", "Works on any device"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Product preview mockup */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {/* POS interface mock */}
              <Card className="col-span-2 overflow-hidden shadow-2xl sm:col-span-1">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-1 text-xs font-medium text-muted-foreground">POS Terminal</span>
                </div>
                <CardContent className="space-y-2 p-3">
                  <div className="flex gap-1">
                    <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Burgers</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Drinks</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Sides</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { n: "Truffle Burger", p: "₱320", img: FOOD_IMG.truffleBurger },
                      { n: "Bacon Cheese", p: "₱280", img: FOOD_IMG.baconBurger },
                      { n: "Craft Latte", p: "₱160", img: FOOD_IMG.icedLatte },
                      { n: "Gyoza", p: "₱180", img: FOOD_IMG.gyoza },
                    ].map((i) => (
                      <div key={i.n} className="rounded-lg border bg-card p-2">
                        <div className="relative mb-1 h-14 w-full overflow-hidden rounded-lg bg-muted">
                          <Image src={i.img} alt={i.n} fill sizes="120px" className="object-cover" />
                        </div>
                        <p className="truncate text-[11px] font-medium">{i.n}</p>
                        <p className="text-[11px] font-bold text-primary">{i.p}</p>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="w-full text-xs">
                    <LayoutGrid className="mr-1 h-3 w-3" /> Charge ₱940
                  </Button>
                </CardContent>
              </Card>

              {/* Mobile QR menu mock */}
              <div className="col-span-2 mx-auto w-40 overflow-hidden rounded-2xl border bg-card shadow-2xl sm:col-span-1">
                <div className="relative h-16 bg-gradient-to-br from-primary/40 to-teal-500/30">
                  <div className="absolute -bottom-4 left-3 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-background bg-primary text-primary-foreground">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                  <Badge className="absolute right-2 top-2 bg-black/40 text-[9px] text-white">Table 4</Badge>
                </div>
                <div className="space-y-2 p-3 pt-6">
                  <p className="text-xs font-bold">Jester’s Grill</p>
                  <div className="flex items-center gap-1.5 rounded-lg border p-1.5">
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded bg-muted">
                      <Image src={FOOD_IMG.ramen} alt="" fill sizes="24px" className="object-cover" />
                    </div>
                    <span className="flex-1 truncate text-[10px]">Tonkotsu Ramen</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] text-primary-foreground">+</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border p-1.5">
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded bg-muted">
                      <Image src={FOOD_IMG.croissant} alt="" fill sizes="24px" className="object-cover" />
                    </div>
                    <span className="flex-1 truncate text-[10px]">Butter Croissant</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] text-primary-foreground">+</span>
                  </div>
                  <Button size="sm" className="w-full text-[10px]">
                    <Smartphone className="mr-1 h-3 w-3" /> Place Order
                  </Button>
                </div>
              </div>
            </div>
            <div className="absolute -left-4 bottom-4 hidden items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg lg:flex">
              <Activity className="h-4 w-4 text-primary" /> Realtime queue
            </div>
          </div>
        </div>
      </section>

      {/* ===== Featured Demo Stores ===== */}
      <section id="demo" className="scroll-mt-20 border-t bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> Live previews
              </p>
              <h2 className="text-3xl font-bold tracking-tight">Explore Demo Stores</h2>
              <p className="mt-1 text-muted-foreground">
                Real guest menus rendered by Expensio Hub. Tap one to try self-ordering.
              </p>
            </div>
          </div>

          {demoStores.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Demo stores will appear here once the sample data is seeded.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {demoStores.map((store) => (
                <Card key={store.slug} className="overflow-hidden transition-colors hover:border-primary">
                  <div className="relative h-36 bg-gradient-to-br from-primary/30 via-slate-700 to-background">
                    {store.cover_url && (
                      <Image
                        src={store.cover_url}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute -bottom-6 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-card shadow-lg">
                      {store.logo_url ? (
                        <Image
                          src={store.logo_url}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <UtensilsCrossed className="h-6 w-6 text-primary" />
                      )}
                    </div>
                  </div>
                  <CardContent className="space-y-2 p-4 pt-9">
                    <h3 className="font-bold">{store.name}</h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {store.description ?? "Tap to view the full menu."}
                    </p>
                    <Button asChild className="mt-2 w-full" size="sm">
                      <Link href={`/menu/${store.slug}`}>
                        View Public Menu
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Key Features Grid ===== */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One platform for counter and table service
            </h2>
            <p className="mt-2 text-muted-foreground">
              Everything your retail shop or restaurant needs to take orders,
              track stock, and grow profit.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="border-border/60 bg-card/50 transition-colors hover:border-primary/50">
                <CardContent className="space-y-3 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-primary" /> {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {[
              { icon: Boxes, label: "Smart Inventory" },
              { icon: List, label: "Fast Barcode Checkout" },
              { icon: QrCode, label: "Table QR Codes" },
              { icon: BarChart3, label: "Profit Reports" },
            ].map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1">
                <c.icon className="h-4 w-4 text-primary" /> {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pricing (Free) ===== */}
      <section id="pricing" className="scroll-mt-20 border-t bg-card/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3 rounded-full">Simple pricing</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Start free. Upgrade never forced.</h2>
            <p className="mt-2 text-muted-foreground">
              Get the full POS, QR menus, and kitchen queue at no cost.
            </p>
          </div>
          <Card className="mx-auto mt-8 max-w-sm border-primary/40 shadow-xl">
            <CardContent className="space-y-5 p-8 text-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Free Launch</p>
                <p className="mt-2 text-5xl font-extrabold">
                  ₱0<span className="text-base font-medium text-muted-foreground">/mo</span>
                </p>
              </div>
              <ul className="space-y-2 text-left text-sm">
                {[
                  "Unlimited items & categories",
                  "Retail + Resto dual mode",
                  "Public QR self-order menus",
                  "Realtime kitchen queue",
                  "Inventory & profit analytics",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {t}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="w-full" asChild>
                <Link href="/auth/login">Get Started Free</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border bg-card/50 p-4 open:border-primary/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA band ===== */}
      <section className="border-t bg-gradient-to-br from-primary/15 via-background to-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to modernize your counter &amp; dining floor?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Spin up your store, print a table QR code, and start taking orders in minutes.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/login">
              Open Merchant POS
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              Expensio Hub
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              The all-in-one cloud POS and QR self-ordering platform for retail
              and restaurants. Built for speed, powered by Supabase.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">expensio.com</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#demo" className="hover:text-foreground">Demo Stores</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Get started</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/auth/login" className="hover:text-foreground">Sign In</Link></li>
              <li><Link href="/auth/login" className="hover:text-foreground">Create Account</Link></li>
              <li><Link href="/admin/pos" className="hover:text-foreground">Merchant POS</Link></li>
            </ul>
            <div className="mt-4 flex gap-3 text-muted-foreground">
              <a href="https://twitter.com/expensiohub" aria-label="Twitter / X" className="hover:text-foreground"><AtSign className="h-5 w-5" /></a>
              <a href="https://github.com/expensio-hub" aria-label="GitHub" className="hover:text-foreground"><Globe className="h-5 w-5" /></a>
              <a href="mailto:support@expensio.com" aria-label="Email support" className="hover:text-foreground"><Mail className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>© {new Date().getFullYear()} Expensio Hub · expensio.com. All rights reserved.</p>
            <p>Made for modern retail &amp; restaurants.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
