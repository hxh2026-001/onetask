import { useEffect, useState } from "react";

type StampAnimationProps = {
  show: boolean;
  axiomName: string;
  passed: boolean;
  onComplete?: () => void;
};

export function StampAnimation({ show, axiomName, passed, onComplete }: StampAnimationProps) {
  const [stampState, setStampState] = useState<"idle" | "stamping" | "stamped">("idle");
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(2);
  const [rotation, setRotation] = useState(-15);

  useEffect(() => {
    if (!show) {
      setStampState("idle");
      setOpacity(0);
      setScale(2);
      setRotation(-15);
      return;
    }

    setStampState("stamping");

    const startTime = Date.now();
    const duration = 500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      setOpacity(eased);
      setScale(2 - eased * 1.5);
      setRotation(-15 + eased * 15);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setStampState("stamped");
        setTimeout(() => onComplete?.(), 1500);
      }
    };

    requestAnimationFrame(animate);
  }, [show, onComplete]);

  if (!show && stampState === "idle") return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
      style={{ opacity: stampState !== "idle" ? opacity : 0 }}
    >
      <div
        className={`px-8 py-6 rounded-lg border-4 ${
          passed
            ? "border-green-500 bg-green-500/10"
            : "border-red-500 bg-red-500/10"
        }`}
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transition: "none"
        }}
      >
        <div
          className={`text-4xl font-bold ${
            passed ? "text-green-400" : "text-red-400"
          }`}
          style={{
            textShadow: passed
              ? "0 0 20px rgba(34, 197, 94, 0.8)"
              : "0 0 20px rgba(239, 68, 68, 0.8)"
          }}
        >
          {passed ? "✓" : "✗"} {axiomName}
        </div>
        <div
          className={`text-center mt-2 text-sm ${
            passed ? "text-green-300" : "text-red-300"
          }`}
        >
          {passed ? "验证通过" : "验证失败"}
        </div>
        {stampState === "stamped" && (
          <div
            className={`absolute -inset-2 rounded-lg ${
              passed ? "animate-ping bg-green-500/30" : "animate-ping bg-red-500/30"
            }`}
          />
        )}
      </div>
    </div>
  );
}
