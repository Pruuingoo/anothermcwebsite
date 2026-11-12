"use client";

import { useEffect } from "react";

const phrases = [
  "Epic Gamemodes.",
  "Lag-Free Gameplay.",
  "Active Community.",
  "Your Journey Begins.",
  "Infinite Adventures.",
];

const galactic = [
  "ᔑ", "ʖ", "ᓵ", "↸", "ᒷ", "⎓", "⊣", "⍑", "╎", "⋮", "ꖌ", "ꖎ", "ᒲ",
  "リ", "𝙹", "¡", "ᑑ", "∷", "ᓭ", "ℸ", "⚍", "⍊", "∴", "‖", "⨅", "⊓",
];

const sgaByLetter: Record<string, string> = Object.fromEntries(
  [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter, index) => [letter, galactic[index]]),
);

const randomGalacticCharacter = () => galactic[Math.floor(Math.random() * galactic.length)];

export default function HomeEffects() {
  useEffect(() => {
    const title = document.querySelector<HTMLElement>("[data-home-hero-shuffle]");
    const intro = document.querySelector<HTMLElement>("[data-home-intro-shuffle]");
    const canvas = document.querySelector<HTMLCanvasElement>(".home-fireflies");
    let shuffleFrame = 0;
    let particleFrame = 0;
    let cycleTimer = 0;
    let resizeTimer = 0;
    let disposed = false;
    let statusTimer = 0;

    const refreshStatus = async () => {
      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        if (!response.ok) return;
        const status = await response.json() as { players?: number; uptime?: string; online?: boolean };
        const players = document.querySelector<HTMLElement>("[data-db-players]");
        const networkPlayers = document.querySelector<HTMLElement>("[data-db-network-players]");
        const uptime = document.querySelector<HTMLElement>("[data-db-uptime]");
        if (players && typeof status.players === "number") players.textContent = String(status.players);
        if (networkPlayers && typeof status.players === "number") networkPlayers.textContent = String(status.players);
        if (uptime && status.uptime) uptime.textContent = status.uptime;
        const statusLabel = document.querySelector<HTMLElement>("[data-db-online]");
        if (statusLabel) statusLabel.textContent = status.online ? "Online" : "Offline";
      } catch {
        // The server-rendered values remain visible if the status endpoint is unavailable.
      }
    };

    const shuffleTo = (element: HTMLElement | null, target: string, done: () => void) => {
      if (!element) return done();
      const chars = [...target];
      const startedAt = performance.now();
      const duration = 950;
      const resolveDelay = 0.3;
      const frameDelay = 1000 / 24;
      let lastFrame = 0;
      element.dataset.shuffleState = "active";

      const quartOut = (x: number) => 1 - (1 - x) ** 4;
      const quadInOut = (x: number) => x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) ** 2) / 2;
      const render = (now: number) => {
        if (disposed) return;
        if (now - lastFrame < frameDelay) {
          shuffleFrame = window.requestAnimationFrame(render);
          return;
        }
        lastFrame = now;
        const t = Math.min(1, (now - startedAt) / duration);
        const revealedLength = Math.round(quartOut(t) * chars.length);
        const resolveProgress = Math.min(1, Math.max(0, t - resolveDelay) / (1 - resolveDelay));
        const resolvedLength = Math.round(quadInOut(resolveProgress) * chars.length);

        const frame = chars.map((char, index) => {
          // The referenced shuffle algorithm reveals character positions from left to right.
          let output = index >= revealedLength ? " " : char;
          if (output !== " " && index >= resolvedLength) {
            const normalized = output.toUpperCase();
            output = sgaByLetter[normalized] ?? randomGalacticCharacter();
          }
          return output;
        }).join("");

        element.textContent = t >= 1 ? target : frame;
        if (t < 1) shuffleFrame = window.requestAnimationFrame(render);
        else done();
      };

      shuffleFrame = window.requestAnimationFrame(render);
    };

    let phraseIndex = 4;
    const cycle = () => {
      if (disposed || !title) return;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      shuffleTo(title, phrases[phraseIndex], () => {
        delete title.dataset.shuffleState;
        cycleTimer = window.setTimeout(cycle, 950);
      });
    };

    let context: CanvasRenderingContext2D | null = null;
    let particles: Array<{ x: number; y: number; size: number; phase: number; speed: number; drift: number }> = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const resizeCanvas = () => {
      if (!canvas || !context) return;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = Math.min(72, Math.max(24, Math.round(width / 14)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 1.15,
        drift: (Math.random() - 0.5) * 32,
      }));
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    void refreshStatus();
    if (!prefersReducedMotion && intro) {
      const introText = intro.textContent || "";
      shuffleTo(intro, introText, () => { delete intro.dataset.shuffleState; });
    }
    statusTimer = window.setInterval(refreshStatus, 60_000);
    if (canvas) {
      context = canvas.getContext("2d");
      resizeCanvas();
      if (!prefersReducedMotion && context) {
        const draw = (now: number) => {
          if (disposed || !context) return;
          context.clearRect(0, 0, width, height);
          for (const particle of particles) {
            const alpha = 0.08 + (0.46 * (0.5 + 0.5 * Math.sin(now * 0.001 * particle.speed + particle.phase)));
            const x = (particle.x + Math.sin(now * 0.00034 + particle.phase) * particle.drift + width) % width;
            const y = (particle.y - ((now * 0.004 * particle.speed) % (height + 12)) + height + 12) % (height + 12) - 6;
            context.beginPath();
            context.fillStyle = `rgba(255, 220, 82, ${alpha})`;
            context.shadowColor = `rgba(255, 213, 58, ${alpha * 1.8})`;
            context.shadowBlur = 11;
            context.fillRect(x - particle.size / 2, y - particle.size / 2, particle.size, particle.size);
          }
          context.shadowBlur = 0;
          particleFrame = window.requestAnimationFrame(draw);
        };
        particleFrame = window.requestAnimationFrame(draw);
        const onResize = () => {
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(resizeCanvas, 100);
        };
        window.addEventListener("resize", onResize, { passive: true });
        cycleTimer = window.setTimeout(cycle, 2600);
        return () => {
          disposed = true;
          window.cancelAnimationFrame(shuffleFrame);
          window.cancelAnimationFrame(particleFrame);
          window.clearTimeout(cycleTimer);
          window.clearTimeout(resizeTimer);
          window.clearInterval(statusTimer);
          window.removeEventListener("resize", onResize);
        };
      }
    }

    if (!prefersReducedMotion) cycleTimer = window.setTimeout(cycle, 2600);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(shuffleFrame);
      window.cancelAnimationFrame(particleFrame);
      window.clearTimeout(cycleTimer);
      window.clearTimeout(resizeTimer);
      window.clearInterval(statusTimer);
    };
  }, []);

  return <canvas className="home-fireflies" aria-hidden="true" />;
}
