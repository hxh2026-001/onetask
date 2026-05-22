import { useState } from "react";
import type { LABColor } from "~/lib/colorMath";

type ColorInputProps = {
  color: LABColor;
  onChange: (color: LABColor) => void;
  label?: string;
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

export function ColorInput({ color, onChange, label }: ColorInputProps) {
  const [hex, setHex] = useState(labToHex(color));

  const handleHexChange = (newHex: string) => {
    setHex(newHex);
    if (newHex.length === 7) {
      const r = parseInt(newHex.slice(1, 3), 16) / 255;
      const g = parseInt(newHex.slice(3, 5), 16) / 255;
      const b = parseInt(newHex.slice(5, 7), 16) / 255;

      const srgbToLinear = (c: number) =>
        c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      const lr = srgbToLinear(r);
      const lg = srgbToLinear(g);
      const lb = srgbToLinear(b);

      const x = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
      const y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175;
      const z = lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041;

      const refX = 0.95047;
      const refY = 1.0;
      const refZ = 1.08883;

      const f = (t: number) =>
        t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;

      const fx = f(x / refX);
      const fy = f(y / refY);
      const fz = f(z / refZ);

      onChange({
        l: 116 * fy - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz)
      });
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-12 h-12 rounded cursor-pointer border border-gray-700"
        />
        <div className="flex-1 grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500 block">L*</label>
            <input
              type="number"
              value={color.l.toFixed(1)}
              onChange={(e) => onChange({ ...color, l: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">a*</label>
            <input
              type="number"
              value={color.a.toFixed(1)}
              onChange={(e) => onChange({ ...color, a: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              min={-128}
              max={127}
              step={0.1}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">b*</label>
            <input
              type="number"
              value={color.b.toFixed(1)}
              onChange={(e) => onChange({ ...color, b: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              min={-128}
              max={127}
              step={0.1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
