import { useEffect, useState, useRef } from "react";
import type { LABColor } from "~/lib/colorMath";

type FragmentShowerProps = {
  trigger: boolean;
  colors: LABColor[];
  onComplete?: () => void;
};

type Fragment = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  color: LABColor;
  size: number;
  alpha: number;
};

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

export function FragmentShower({ trigger, colors, onComplete }: FragmentShowerProps) {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger || isAnimating) return;

    setIsAnimating(true);

    const newFragments: Fragment[] = [];
    const colorsToUse = colors.length > 0 ? colors : [{ l: 50, a: 0, b: 0 }];

    for (let i = 0; i < 30; i++) {
      const color = colorsToUse[i % colorsToUse.length];
      newFragments.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 720,
        color,
        size: 8 + Math.random() * 12,
        alpha: 1
      });
    }

    setFragments(newFragments);

    let startTime = Date.now();
    const duration = 2000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        setFragments([]);
        setIsAnimating(false);
        onComplete?.();
        return;
      }

      setFragments((prev) =>
        prev.map((f) => ({
          ...f,
          x: f.x + (f.vx * 16) / 1000,
          y: f.y + (f.vy * 16) / 1000 + progress * 50,
          rotation: f.rotation + (f.vr * 16) / 1000,
          alpha: 1 - progress
        }))
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, colors, isAnimating, onComplete]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {fragments.map((f) => (
        <div
          key={f.id}
          className="absolute"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size,
            height: f.size,
            backgroundColor: labToHex(f.color),
            opacity: f.alpha,
            transform: `rotate(${f.rotation}deg)`,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            boxShadow: `0 0 ${f.size}px ${labToHex(f.color)}`
          }}
        />
      ))}
    </div>
  );
}
