"use client";

import { QRCodeSVG } from "qrcode.react";

/** Renders a scannable QR code for the given value (the order tracking URL). */
export function OrderQrCode({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="inline-block rounded-lg border bg-white p-3">
        <QRCodeSVG value={value} size={160} level="M" />
      </div>
    </div>
  );
}
