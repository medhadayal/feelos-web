'use client';

import React, { useEffect, useRef } from "react";

export default function AIAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const mouthOpenRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // background
      ctx.fillStyle = "#071029";
      ctx.fillRect(0, 0, w, h);

      // head
      const cx = w / 2;
      const cy = h / 2 - 20 * devicePixelRatio;
      const headR = Math.min(w, h) * 0.28;

      ctx.beginPath();
      ctx.fillStyle = "#7dd3fc"; // cartoon color
      ctx.arc(cx, cy, headR, 0, Math.PI * 2);
      ctx.fill();

      // eyes
      ctx.fillStyle = "#062022";
      ctx.beginPath();
      ctx.ellipse(cx - headR * 0.4, cy - headR * 0.2, headR * 0.11, headR * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + headR * 0.4, cy - headR * 0.2, headR * 0.11, headR * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // mouth animation
      const targetOpen = isSpeaking ? 0.9 : 0.05;
      mouthOpenRef.current += (targetOpen - mouthOpenRef.current) * 0.2;
      const mouthW = headR * 0.9;
      const mouthH = headR * 0.12 * Math.max(0.001, mouthOpenRef.current);
      const mouthX = cx - mouthW / 2;
      const mouthY = cy + headR * 0.2;

      ctx.fillStyle = "#062022";
      roundRect(ctx, mouthX, mouthY, mouthW, mouthH, mouthH / 2);

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
