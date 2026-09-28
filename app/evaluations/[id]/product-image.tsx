"use client";
import { useState } from "react";

export function ProductImage({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="product-image-placeholder"><span>Product page</span><small>Image not captured</small></div>;
  // The source is captured retailer media; no server-side image proxy is used.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="product-image" src={src} alt={title} referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
