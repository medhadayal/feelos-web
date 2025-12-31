'use client';

import React, { useEffect, useRef } from "react";

export default function AIAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const mouthOpenRef = useRef(0);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const context: CanvasRenderingContext2D = ctx;

    function resize() {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      context.clearRect(0, 0, w, h);

      // background
      context.fillStyle = "#071029";
      context.fillRect(0, 0, w, h);

      // head
      const cx = w / 2;
      const cy = h / 2 - 20 * devicePixelRatio;
      const headR = Math.min(w, h) * 0.28;

      context.beginPath();
      context.fillStyle = "#7dd3fc"; // cartoon color
      context.arc(cx, cy, headR, 0, Math.PI * 2);
      context.fill();

      // eyes
      context.fillStyle = "#062022";
      context.beginPath();
      context.ellipse(cx - headR * 0.4, cy - headR * 0.2, headR * 0.11, headR * 0.14, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.ellipse(cx + headR * 0.4, cy - headR * 0.2, headR * 0.11, headR * 0.14, 0, 0, Math.PI * 2);
      context.fill();

      // mouth animation
      const targetOpen = isSpeaking ? 0.9 : 0.05;
      mouthOpenRef.current += (targetOpen - mouthOpenRef.current) * 0.2;
      const mouthW = headR * 0.9;
      const mouthH = headR * 0.12 * Math.max(0.001, mouthOpenRef.current);
      const mouthX = cx - mouthW / 2;
      const mouthY = cy + headR * 0.2;

      context.fillStyle = "#062022";
      roundRect(context, mouthX, mouthY, mouthW, mouthH, mouthH / 2);

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isSpeaking]);

  return <canvas ref={canvasRef} className="w-full h-64 rounded-xl bg-transparent" />;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
