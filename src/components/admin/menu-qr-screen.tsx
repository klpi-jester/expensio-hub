"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Download, Printer, ExternalLink, QrCode } from "lucide-react";

const SIZES = [192, 256, 384, 512] as const;

export function MenuQrScreen({
  storeName,
  storeSlug,
  publicUrl,
}: {
  storeName: string;
  storeSlug: string;
  publicUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<(typeof SIZES)[number]>(256);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Menu link copied");
    } catch {
      toast.error("Couldn’t copy — select the link and copy manually");
    }
  }

  /** Returns a PNG data URL from the rendered QR canvas, or null. */
  function pngDataUrl(): string | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  }

  function downloadPng() {
    const url = pngDataUrl();
    if (!url) return toast.error("QR not ready yet");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeSlug}-menu-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("QR downloaded");
  }

  /** Opens a print-ready table tent in a new window using the QR PNG. */
  function printQr() {
    const dataUrl = pngDataUrl();
    if (!dataUrl) return toast.error("QR not ready yet");

    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) {
      toast.error("Enable pop-ups to print the QR");
      return;
    }
    win.document.write(`<!doctype html><html><head><title>${storeName} — Menu QR</title>
      <style>
        @page { margin: 16mm; }
        body { font-family: system-ui, -apple-system, sans-serif; text-align: center; color: #111; margin: 0; padding: 24px; }
        .tent { border: 2px solid #111; border-radius: 16px; padding: 28px 20px; max-width: 360px; margin: 0 auto; }
        .brand { font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: #666; margin: 0 0 4px; }
        h1 { font-size: 24px; margin: 0 0 16px; }
        img { width: 240px; height: 240px; image-rendering: pixelated; }
        p { font-size: 15px; margin: 14px 0 4px; }
        .url { font-size: 11px; color: #666; word-break: break-all; margin-top: 10px; }
      </style></head>
      <body onload="window.focus();window.print();">
        <div class="tent">
          <p class="brand">Scan to order</p>
          <h1>${storeName}</h1>
          <img src="${dataUrl}" alt="Menu QR code" />
          <p>Point your camera here to view our menu &amp; place an order.</p>
          <p class="url">${publicUrl}</p>
        </div>
      </body></html>`);
    win.document.close();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-6 pt-6 sm:flex-row sm:items-start">
          {/* QR preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <QRCodeCanvas
                ref={canvasRef}
                value={publicUrl}
                size={size}
                level="M"
                marginSize={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="qr-size" className="text-xs text-muted-foreground">
                Size
              </Label>
              <Select
                value={String(size)}
                onValueChange={(v) => setSize(Number(v) as (typeof SIZES)[number])}
              >
                <SelectTrigger id="qr-size" className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link + actions */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="h-4 w-4" />
              Your public menu link
            </div>

            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="min-w-0 flex-1 truncate text-sm">{publicUrl}</code>
              <Button size="sm" variant="ghost" onClick={copyLink} aria-label="Copy link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={copyLink} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button onClick={downloadPng} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
              <Button onClick={printQr}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open menu
                </Button>
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Print or download the code to place on tables and counters.
              Customers scan it to open <code>/menu/{storeSlug}</code> and order.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
