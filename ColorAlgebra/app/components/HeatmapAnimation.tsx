import { useEffect, useRef, useState } from "react";
import type { LABColor } from "~/lib/colorMath";
import { deltaE } from "~/lib/colorMath";

type HeatmapAnimationProps = {
  colors: LABColor[];
  isAnimating: boolean;
};

export function HeatmapAnimation({ colors, isAnimating }: HeatmapAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!isAnimating) {
      setAnimationProgress(0);
      return;
    }

    const animate = () => {
      setAnimationProgress((prev) => (prev + 0.02) % 1);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  useEffect(() => {
    if (!canvasRef.current || colors.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    const cellSize = size / colors.length;

    const maxDistance = Math.max(
      ...Array.from({ length: colors.length }, (_, i) =>
        Math.max(
          ...Array.from({ length: colors.length }, (_, j) => deltaE(colors[i], colors[j]))
        )
      )
    );

    ctx.fillStyle = "#111122";
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < colors.length; i++) {
      for (let j = 0; j < colors.length; j++) {
        const distance = deltaE(colors[i], colors[j]);
        const normalized = distance / (maxDistance || 1);

        const wave = Math.sin(animationProgress * Math.PI * 2 + (i + j) * 0.5) * 0.1;
        const intensity = Math.min(1, normalized + wave);

        const r = Math.round(255 * intensity);
        const g = Math.round(100 * (1 - Math.abs(intensity - 0.5) * 2));
        const b = Math.round(255 * (1 - intensity));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(i * cellSize, j * cellSize, cellSize - 1, cellSize - 1);

        if (cellSize > 30) {
          ctx.fillStyle = intensity > 0.5 ? "#000000" : "#ffffff";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            distance.toFixed(1),
            i * cellSize + cellSize / 2,
            j * cellSize + cellSize / 2
          );
        }
      }
    }

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const hex = labToHex(color);
      ctx.fillStyle = hex;
      ctx.fillRect(i * cellSize, -15, cellSize - 1, 12);
      ctx.fillRect(-15, i * cellSize, 12, cellSize - 1);
    }
  }, [colors, animationProgress]);

  function labToHex(color: LABColor): string {
    const y = (color.l + 16) / 116;
    const a = color.a / 500 + y;
    const b = y - color.b / 200;

    const x = 0.95047 * (Math.pow(a, 3) > 0.008856 ? Math.pow(a, 3) : (a - 16 / 116) / 7.787);
    const yy = 1.0 * (Math.pow(y, 3) > 0.008856 ? Math.pow(y, 3) : (y - 16 / 116) / 7.787);
    const z = 1.08883 * (Math.pow(b, 3) > 0.008856 ? Math.pow(b, 3) : (b - 16 / 116) / 7.787);

    const r = x * 3.2406 + yy * -1.5372 + z * -0.4986;
    const g = x * -0.9689 + yy * 1.8758 + z * 0.0415;
    const bl = x * 0.0557 + yy * -0.204 + z * 1.057;

    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const toHex = (v: number) => Math.round(clamp(v) * 255).toString(16).padStart(2, "0");

    return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-lg border border-gray-700"
      />
      {isAnimating && (
        <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
          波动中...
        </div>
      )}
    </div>
  );
}
