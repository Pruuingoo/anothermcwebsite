"use client";
import { useEffect } from "react";

export function CanvasMotes() {
  useEffect(() => {
    const canvas = document.getElementById("fx") as HTMLCanvasElement;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const raw = canvas.getContext("2d"); if (!raw) return; const ctx = raw as CanvasRenderingContext2D;

    let motes: any[] = [];
    let frame: number = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function palette() {
      const styles = getComputedStyle(document.documentElement);
      return [
        `hsl(${styles.getPropertyValue("--primary")?.trim() || "143 67% 47%"})`,
        `hsl(${styles.getPropertyValue("--accent")?.trim() || "42 95% 57%"})`,
        `hsl(${styles.getPropertyValue("--foreground")?.trim() || "210 25% 96%"})`,
      ];
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const colors = palette();
      const count = Math.round(Math.min(window.innerWidth / 12, 90));
      motes = [];
      for (let i = 0; i < count; i++) {
        const size = 2 + Math.round(Math.random() * 5);
        motes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vy: -(0.12 + Math.random() * 0.42),
          vx: (Math.random() - 0.5) * 0.14,
          size,
          alpha: 0.05 + Math.random() * 0.22,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const m of motes) {
        m.y += m.vy;
        m.x += m.vx;
        if (m.y < -12) {
          m.y = window.innerHeight + 12;
          m.x = Math.random() * window.innerWidth;
        }
        if (m.x < -12) m.x = window.innerWidth + 12;
        if (m.x > window.innerWidth + 12) m.x = -12;
        ctx.globalAlpha = m.alpha;
        ctx.fillStyle = m.color;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), m.size, m.size);
      }
      ctx.globalAlpha = 1;
      frame = window.requestAnimationFrame(tick);
    }

    let relayout = 0;
    const onResize = () => {
      window.clearTimeout(relayout);
      relayout = window.setTimeout(resize, 180);
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else {
        build();
        tick();
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);

    resize();
    tick();

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(relayout);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas id="fx" aria-hidden="true" />;
}
