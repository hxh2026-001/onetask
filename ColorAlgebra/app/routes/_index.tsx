import { useState, useCallback, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import type { LABColor, GroupAxiomCheck } from "~/lib/colorMath";
import { ColorLabScene } from "~/components/ColorLabScene";
import { ColorInput } from "~/components/ColorInput";
import { HeatmapAnimation } from "~/components/HeatmapAnimation";
import { StampAnimation } from "~/components/StampAnimation";
import { FragmentShower } from "~/components/FragmentShower";

type Trajectory = {
  from: LABColor;
  to: LABColor;
  progress: number;
};

type PresetResult = {
  config: Record<string, unknown>;
  description: string;
  colors?: LABColor[];
  labels?: string[];
  leftAssoc?: LABColor;
  rightAssoc?: LABColor;
  difference?: { l: number; a: number; b: number };
  floatError?: number;
  zeroElement?: LABColor;
  results?: { input: LABColor; zero: LABColor; result: LABColor; isAbsorbed: boolean }[];
  identity?: LABColor;
  pairs?: { color: LABColor; inverse: LABColor; result: LABColor; identity: LABColor; distance: number; cancelled: boolean }[];
  warpedColors?: { original: LABColor; warped: LABColor }[];
  originalDistances?: number[][];
  warpedDistances?: number[][];
  gamma?: number;
};

const PRESETS = [
  { id: "non-associative-mixing", name: "预设一", desc: "非结合律色彩混合", icon: "🔀" },
  { id: "zero-element-absorb", name: "预设二", desc: "零元色彩吞噬", icon: "⚫" },
  { id: "inverse-element-cancel", name: "预设三", desc: "逆元色彩抵消", icon: "🔄" },
  { id: "singular-color-mapping", name: "预设四", desc: "奇异色彩映射", icon: "🌀" },
];

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

export default function Index() {
  const [colors, setColors] = useState<LABColor[]>([
    { l: 50, a: 80, b: 20 },
    { l: 60, a: -60, b: 40 },
    { l: 40, a: 30, b: -50 },
  ]);

  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [operation, setOperation] = useState<"add" | "multiply">("add");
  const [trajectories, setTrajectories] = useState<Trajectory[]>([]);
  const [showStamp, setShowStamp] = useState(false);
  const [stampData, setStampData] = useState({ name: "", passed: true });
  const [showFragments, setShowFragments] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapColors, setHeatmapColors] = useState<LABColor[]>([]);
  const [presetResult, setPresetResult] = useState<PresetResult | null>(null);
  const [axiomResult, setAxiomResult] = useState<GroupAxiomCheck | null>(null);
  const [operationResult, setOperationResult] = useState<{
    result: LABColor;
    overflow: boolean;
    floatError: number;
    hex: string;
  } | null>(null);

  const colorFetcher = useFetcher();
  const algebraFetcher = useFetcher();
  const presetFetcher = useFetcher();

  const animateTrajectory = useCallback((from: LABColor, to: LABColor) => {
    const trajectory: Trajectory = { from, to, progress: 0 };
    setTrajectories([trajectory]);

    const animate = () => {
      setTrajectories((prev) => {
        if (prev.length === 0) return prev;
        const newProgress = prev[0].progress + 0.02;
        if (newProgress >= 1) {
          return [];
        }
        return [{ ...prev[0], progress: newProgress }];
      });

      if (trajectory.progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  const handleOperate = useCallback(() => {
    if (colors.length < 2) return;

    const c1 = colors[0];
    const c2 = colors[1];

    const formData = new FormData();
    formData.append("intent", "operate");
    formData.append("operation", operation);
    formData.append("color1", JSON.stringify(c1));
    formData.append("color2", JSON.stringify(c2));

    colorFetcher.submit(formData, { method: "post", action: "/api/colors" });

    animateTrajectory(c1, c2);
  }, [colors, operation, colorFetcher, animateTrajectory]);

  useEffect(() => {
    if (colorFetcher.data && colorFetcher.state !== "submitting") {
      const data = colorFetcher.data as {
        result: LABColor;
        overflow: boolean;
        floatError: number;
        hex: string;
      };
      setOperationResult(data);

      if (data.overflow) {
        setShowFragments(true);
      }
    }
  }, [colorFetcher.data, colorFetcher.state]);

  const handleCheckAxioms = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "check-axioms");
    formData.append("colors", JSON.stringify(colors));
    formData.append("operation", operation);

    algebraFetcher.submit(formData, { method: "post", action: "/api/algebra" });
  }, [colors, operation, algebraFetcher]);

  useEffect(() => {
    if (algebraFetcher.data && algebraFetcher.state === "idle") {
      const data = algebraFetcher.data as GroupAxiomCheck & { executionTime: number };
      setAxiomResult(data);

      const axioms = [
        { name: "封闭性", passed: data.closure.passed },
        { name: "结合律", passed: data.associativity.passed },
        { name: "恒等元", passed: data.identity.passed },
        { name: "逆元", passed: data.inverse.passed },
      ];

      let index = 0;
      const showNextStamp = () => {
        if (index < axioms.length) {
          setStampData(axioms[index]);
          setShowStamp(true);
          index++;
        }
      };

      showNextStamp();

      if (!data.allPassed) {
        setTimeout(() => setShowFragments(true), 2000);
      }
    }
  }, [algebraFetcher.data, algebraFetcher.state]);

  const handleStampComplete = useCallback(() => {
    setShowStamp(false);
  }, []);

  const handlePreset = useCallback((presetId: string) => {
    const formData = new FormData();
    formData.append("preset", presetId);

    presetFetcher.submit(formData, { method: "post", action: "/api/presets" });
  }, [presetFetcher]);

  useEffect(() => {
    if (presetFetcher.data && presetFetcher.state === "idle") {
      const data = presetFetcher.data as PresetResult;
      setPresetResult(data);

      if (data.colors) {
        setColors(data.colors);
        setHeatmapColors(data.colors);
      }

      if (data.warpedColors) {
        setColors([
          ...data.warpedColors.map((w) => w.original),
          ...data.warpedColors.map((w) => w.warped),
        ]);
        setHeatmapColors(data.warpedColors.map((w) => w.original));
      }

      setShowHeatmap(true);
    }
  }, [presetFetcher.data, presetFetcher.state]);

  const addColor = () => {
    setColors([...colors, { l: 50 + Math.random() * 30, a: (Math.random() - 0.5) * 100, b: (Math.random() - 0.5) * 100 }]);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
    if (selectedColorIndex >= colors.length - 1) {
      setSelectedColorIndex(0);
    }
  };

  const updateColor = (index: number, newColor: LABColor) => {
    setColors(colors.map((c, i) => (i === index ? newColor : c)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            色彩混合代数创作工具
          </h1>
          <p className="text-gray-400 text-sm mt-1">CIELAB 色彩空间代数运算可视化系统</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold mb-3 text-cyan-400">预设代数场景</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePreset(preset.id)}
                className="p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-cyan-500 transition-all group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{preset.icon}</div>
                <div className="text-sm font-medium text-white">{preset.name}</div>
                <div className="text-xs text-gray-400 mt-1">{preset.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 relative">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-purple-400">CIELAB 三维色彩空间</h2>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">L*轴</span>
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">a*轴</span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">b*轴</span>
                </div>
              </div>
              <div className="h-96 relative">
                <ColorLabScene
                  colors={colors}
                  trajectories={trajectories}
                  onColorSelect={(_, index) => setSelectedColorIndex(index)}
                  selectedIndex={selectedColorIndex}
                />
                <StampAnimation
                  show={showStamp}
                  axiomName={stampData.name}
                  passed={stampData.passed}
                  onComplete={handleStampComplete}
                />
                <FragmentShower
                  trigger={showFragments}
                  colors={colors}
                  onComplete={() => setShowFragments(false)}
                />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-3 text-pink-400">色彩距离热力图</h2>
              <div className="flex gap-4">
                <HeatmapAnimation
                  colors={heatmapColors.length > 0 ? heatmapColors : colors}
                  isAnimating={showHeatmap}
                />
                <div className="flex-1 text-sm space-y-2">
                  <div className="text-gray-400">色彩距离矩阵可视化</div>
                  <div className="text-gray-500 text-xs">
                    观察非线性空间中的度量失真
                  </div>
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                  >
                    {showHeatmap ? "停止波动" : "开始波动"}
                  </button>
                </div>
              </div>
            </div>

            {presetResult && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold mb-3 text-yellow-400">预设计算结果</h2>
                <div className="text-sm text-gray-300 mb-2">{presetResult.description}</div>
                {presetResult.difference && (
                  <div className="bg-gray-900 rounded p-3 space-y-1">
                    <div className="text-cyan-400">浮点误差检测:</div>
                    <div className="text-xs text-gray-400">
                      左结合 (A+B)+C = ({presetResult.leftAssoc?.l.toFixed(4)}, {presetResult.leftAssoc?.a.toFixed(4)}, {presetResult.leftAssoc?.b.toFixed(4)})
                    </div>
                    <div className="text-xs text-gray-400">
                      右结合 A+(B+C) = ({presetResult.rightAssoc?.l.toFixed(4)}, {presetResult.rightAssoc?.a.toFixed(4)}, {presetResult.rightAssoc?.b.toFixed(4)})
                    </div>
                    <div className="text-xs text-red-400">
                      误差: ΔL={presetResult.difference.l.toFixed(6)}, Δa={presetResult.difference.a.toFixed(6)}, Δb={presetResult.difference.b.toFixed(6)}
                    </div>
                    <div className="text-xs text-yellow-400 mt-2">
                      总浮点误差: {presetResult.floatError?.toFixed(10)}
                    </div>
                  </div>
                )}
                {presetResult.results && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {presetResult.results.map((r, i) => (
                      <div key={i} className="bg-gray-900 rounded p-2">
                        <div className="text-xs text-gray-400">色彩 {presetResult.labels?.[i] || i + 1}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: labToHex(r.input) }}
                          />
                          <span className="text-xs">×</span>
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: labToHex(r.zero) }}
                          />
                          <span className="text-xs">=</span>
                          <div
                            className="w-6 h-6 rounded border-2 border-red-500"
                            style={{ backgroundColor: labToHex(r.result) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {presetResult.pairs && (
                  <div className="space-y-2 mt-2">
                    {presetResult.pairs.map((p, i) => (
                      <div key={i} className="bg-gray-900 rounded p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: labToHex(p.color) }} />
                          <span className="text-lg">+</span>
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: labToHex(p.inverse) }} />
                          <span className="text-lg">=</span>
                          <div className="w-8 h-8 rounded border-2 border-cyan-500" style={{ backgroundColor: labToHex(p.result) }} />
                        </div>
                        <div className="text-xs mt-1">
                          {p.cancelled ? (
                            <span className="text-green-400">✓ 成功抵消，距恒等元: {p.distance.toFixed(4)}</span>
                          ) : (
                            <span className="text-red-400">✗ 抵消失败，距恒等元: {p.distance.toFixed(4)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {presetResult.warpedColors && (
                  <div className="space-y-2 mt-2">
                    <div className="text-cyan-400 text-sm">非线性变换 (γ={presetResult.gamma})</div>
                    <div className="grid grid-cols-3 gap-2">
                      {presetResult.warpedColors.map((w, i) => (
                        <div key={i} className="bg-gray-900 rounded p-2 text-center">
                          <div className="text-xs text-gray-400">原始</div>
                          <div className="w-12 h-12 rounded mx-auto" style={{ backgroundColor: labToHex(w.original) }} />
                          <div className="text-xs text-gray-400 mt-1">变换后</div>
                          <div className="w-12 h-12 rounded mx-auto border border-purple-500" style={{ backgroundColor: labToHex(w.warped) }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {operationResult && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold mb-3 text-green-400">运算结果</h2>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-lg shadow-lg"
                      style={{
                        backgroundColor: operationResult.hex,
                        boxShadow: `0 0 30px ${operationResult.hex}`
                      }}
                    />
                    <div className="text-xs text-gray-400 mt-1">结果色彩</div>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-900 rounded p-2">
                      <div className="text-gray-500 text-xs">L*</div>
                      <div className="text-cyan-400">{operationResult.result.l.toFixed(4)}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-2">
                      <div className="text-gray-500 text-xs">a*</div>
                      <div className="text-green-400">{operationResult.result.a.toFixed(4)}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-2">
                      <div className="text-gray-500 text-xs">b*</div>
                      <div className="text-blue-400">{operationResult.result.b.toFixed(4)}</div>
                    </div>
                  </div>
                </div>
                {operationResult.overflow && (
                  <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
                    ⚠️ 色彩溢出检测！浮点误差: {operationResult.floatError.toFixed(6)}
                  </div>
                )}
              </div>
            )}

            {axiomResult && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold mb-3 text-orange-400">群公理验证结果</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className={`p-3 rounded border ${axiomResult.closure.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}>
                    <div className="text-center">
                      <div className="text-2xl">{axiomResult.closure.passed ? "✓" : "✗"}</div>
                      <div className="text-xs text-gray-400">封闭性</div>
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${axiomResult.associativity.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}>
                    <div className="text-center">
                      <div className="text-2xl">{axiomResult.associativity.passed ? "✓" : "✗"}</div>
                      <div className="text-xs text-gray-400">结合律</div>
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${axiomResult.identity.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}>
                    <div className="text-center">
                      <div className="text-2xl">{axiomResult.identity.passed ? "✓" : "✗"}</div>
                      <div className="text-xs text-gray-400">恒等元</div>
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${axiomResult.inverse.passed ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}`}>
                    <div className="text-center">
                      <div className="text-2xl">{axiomResult.inverse.passed ? "✓" : "✗"}</div>
                      <div className="text-xs text-gray-400">逆元</div>
                    </div>
                  </div>
                </div>
                <div className={`mt-3 text-center font-medium ${axiomResult.allPassed ? "text-green-400" : "text-red-400"}`}>
                  {axiomResult.allPassed ? "✓ 构成群结构" : "✗ 不构成群结构"}
                </div>
                {axiomResult.associativity.counterExamples.length > 0 && (
                  <div className="mt-2 text-xs text-red-400">
                    反例数: {axiomResult.associativity.counterExamples.length} 个
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-3 text-cyan-400">运算设置</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">运算类型</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOperation("add")}
                      className={`flex-1 py-2 rounded ${operation === "add" ? "bg-cyan-600" : "bg-gray-700 hover:bg-gray-600"}`}
                    >
                      加法群
                    </button>
                    <button
                      onClick={() => setOperation("multiply")}
                      className={`flex-1 py-2 rounded ${operation === "multiply" ? "bg-purple-600" : "bg-gray-700 hover:bg-gray-600"}`}
                    >
                      乘法半群
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleOperate}
                  disabled={colors.length < 2}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded font-medium disabled:opacity-50"
                >
                  执行运算 ({operation === "add" ? "C₁ + C₂" : "C₁ × C₂"})
                </button>
                <button
                  onClick={handleCheckAxioms}
                  className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded font-medium"
                >
                  验证群公理
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-purple-400">色彩样本</h2>
                <button
                  onClick={addColor}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  + 添加
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      selectedColorIndex === index
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-gray-700 bg-gray-700/30"
                    }`}
                    onClick={() => setSelectedColorIndex(index)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-400">色彩 #{index + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeColor(index);
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <ColorInput
                      color={color}
                      onChange={(newColor) => updateColor(index, newColor)}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: labToHex(color) }}
                      />
                      <span className="text-xs text-gray-500">{labToHex(color).toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-3 text-yellow-400">可视化说明</h2>
              <div className="text-xs text-gray-400 space-y-2">
                <p>🔴 <span className="text-red-400">L*轴</span> - 明度 (0-100)</p>
                <p>🟢 <span className="text-green-400">a*轴</span> - 红绿分量 (-128 到 127)</p>
                <p>🔵 <span className="text-blue-400">b*轴</span> - 黄蓝分量 (-128 到 127)</p>
                <p className="mt-2">点击色彩球可选中，观察轨迹动画、碎片飞散效果</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
