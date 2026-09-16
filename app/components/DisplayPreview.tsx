"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hexToRgb } from "@/lib/awtrix";
import { cn } from "@/lib/utils";

const COLS = 32;
const ROWS = 8;

interface DisplayPreviewProps {
  text: string;
  colorHex?: string;
  className?: string;
}

/**
 * Visual 32×8 LED matrix preview that scrolls the active question text.
 * Approximates the Ulanzi TC001 / AWTRIX look for the couple's dashboard.
 */
export function DisplayPreview({
  text,
  colorHex = "#FF6B8A",
  className,
}: DisplayPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapRef = useRef<Uint8ClampedArray | null>(null);
  const bitmapWidthRef = useRef(COLS);
  const [offset, setOffset] = useState(COLS + 2);
  const rgb = useMemo(() => hexToRgb(colorHex), [colorHex]);

  // Build a 1-bit-ish luminance map of the scrolling text once per string
  useEffect(() => {
    const measure = document.createElement("canvas");
    const mctx = measure.getContext("2d", { willReadFrequently: true });
    if (!mctx) return;

    mctx.font = `bold ${ROWS}px monospace`;
    const textWidth = Math.ceil(mctx.measureText(text || " ").width) + 4;
    const width = Math.max(textWidth + COLS, COLS * 2);

    measure.width = width;
    measure.height = ROWS;
    const ctx = measure.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, width, ROWS);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${ROWS}px monospace`;
    ctx.textBaseline = "middle";
    ctx.fillText(text || " ", 0, ROWS / 2 + 0.5);

    bitmapRef.current = ctx.getImageData(0, 0, width, ROWS).data;
    bitmapWidthRef.current = width;
    setOffset(COLS + 2);
  }, [text]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 90);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const bitmap = bitmapRef.current;
    if (!canvas || !bitmap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cellW = cssW / COLS;
    const cellH = cssH / ROWS;
    const pad = Math.max(1, Math.min(cellW, cellH) * 0.18);
    const loopWidth = bitmapWidthRef.current;
    const scroll = ((offset % loopWidth) + loopWidth) % loopWidth;
    const [r, g, b] = rgb;

    ctx.fillStyle = "#0c0a0b";
    ctx.fillRect(0, 0, cssW, cssH);

    const grad = ctx.createRadialGradient(
      cssW / 2,
      cssH / 2,
      4,
      cssW / 2,
      cssH / 2,
      cssW * 0.7
    );
    grad.addColorStop(0, "rgba(255,107,138,0.08)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cssW, cssH);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const sx = (x + Math.floor(scroll)) % loopWidth;
        const idx = (y * loopWidth + sx) * 4;
        const alpha = bitmap[idx + 3];

        const px = x * cellW + pad;
        const py = y * cellH + pad;
        const pw = cellW - pad * 2;
        const ph = cellH - pad * 2;

        if (alpha < 40) {
          ctx.fillStyle = "rgba(255,255,255,0.045)";
          ctx.beginPath();
          ctx.roundRect(px, py, pw, ph, 1.5);
          ctx.fill();
          continue;
        }

        const intensity = alpha / 255;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + intensity * 0.65})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.85)`;
        ctx.shadowBlur = Math.max(cellW, cellH) * 0.55;
        ctx.roundRect(px, py, pw, ph, 1.5);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [offset, rgb]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute -inset-3 rounded-[1.4rem] bg-gradient-to-br from-[var(--rose)]/25 via-transparent to-[var(--gold)]/20 blur-xl" />
      <div className="relative overflow-hidden rounded-[1.15rem] border border-white/20 bg-[#141012] p-3 shadow-[0_24px_60px_rgba(28,12,16,0.35)]">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Ulanzi · 32×8
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--rose-soft)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--rose)]" />
            Live preview
          </span>
        </div>
        <canvas
          ref={canvasRef}
          className="h-[88px] w-full rounded-md sm:h-[104px]"
          aria-label={`Matrix preview: ${text}`}
        />
      </div>
    </div>
  );
}
