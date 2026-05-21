import { useState, useEffect, useMemo } from "react";
import { typesetText, optimizeDensity, getGlyphMetrics, simulateBlockingDelay } from "../utils/knuthPlass";
import { TypesetLine } from "../utils/knuthPlass";

interface CompositionPreviewProps {
  text: string;
  lineWidth: number;
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
  simulatePerformanceIssues: boolean;
}

export function CompositionPreview({
  text,
  lineWidth,
  fontSize,
  letterSpacing,
  lineSpacing,
  simulatePerformanceIssues,
}: CompositionPreviewProps) {
  const [lines, setLines] = useState<TypesetLine[]>([]);
  const [animatingLine, setAnimatingLine] = useState<number | null>(null);
  const [baselineWave, setBaselineWave] = useState<number>(0);
  const [candidatePaths, setCandidatePaths] = useState<{ start: number; end: number; cost: number }[]>([]);
  const [springTension, setSpringTension] = useState<number>(0);
  const [inkSpreading, setInkSpreading] = useState<{ charIndex: number; intensity: number }[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!text) {
      setLines([]);
      return;
    }

    setIsCalculating(true);
    
    if (simulatePerformanceIssues) {
      simulateBlockingDelay(2000);
    }

    const start = performance.now();
    let typesetLines = typesetText(text, lineWidth, fontSize, letterSpacing, lineSpacing);
    typesetLines = optimizeDensity(typesetLines, lineWidth);
    const end = performance.now();
    
    console.log(`Typesetting completed in ${end - start}ms`);

    setLines(typesetLines);
    setIsCalculating(false);

    setCandidatePaths([
      { start: 0, end: Math.floor(text.length / 3), cost: 100 },
      { start: 0, end: Math.floor(text.length / 2), cost: 80 },
      { start: Math.floor(text.length / 4), end: Math.floor(text.length / 2), cost: 60 },
    ]);
    
    setTimeout(() => setCandidatePaths([]), 2000);

    let lineIndex = 0;
    const animateLine = () => {
      if (lineIndex < typesetLines.length) {
        setAnimatingLine(lineIndex);
        lineIndex++;
        setTimeout(animateLine, 300);
      } else {
        setAnimatingLine(null);
      }
    };
    
    setTimeout(animateLine, 500);
  }, [text, lineWidth, fontSize, letterSpacing, lineSpacing, simulatePerformanceIssues]);

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setBaselineWave(prev => (prev + 0.05) % (Math.PI * 2));
    }, 50);
    
    return () => clearInterval(waveInterval);
  }, []);

  useEffect(() => {
    const tensionInterval = setInterval(() => {
      setSpringTension(prev => {
        const next = prev + 0.02;
        return next > 1 ? 0 : next;
      });
    }, 30);
    
    return () => clearInterval(tensionInterval);
  }, []);

  useEffect(() => {
    const inkInterval = setInterval(() => {
      setInkSpreading(prev => {
        if (prev.length > 0) {
          const updated = prev.map(item => ({
            ...item,
            intensity: Math.max(0, item.intensity - 0.05),
          })).filter(item => item.intensity > 0);
          return updated;
        }
        return [];
      });
    }, 100);
    
    return () => clearInterval(inkInterval);
  }, []);

  const handleCharClick = (charIndex: number) => {
    setInkSpreading(prev => [...prev, { charIndex, intensity: 1 }]);
  };

  const allCharacters = useMemo(() => {
    const chars: { char: string; x: number; y: number; lineIndex: number; charIndex: number }[] = [];
    let globalIndex = 0;
    
    lines.forEach((line, lineIndex) => {
      line.characters.forEach((char, charIndex) => {
        const pos = line.positions[charIndex];
        chars.push({
          char,
          x: pos.x,
          y: pos.y,
          lineIndex,
          charIndex: globalIndex,
        });
        globalIndex++;
      });
    });
    
    return chars;
  }, [lines]);

  return (
    <div className="composition-preview">
      <h3 className="preview-title">排版预览</h3>
      
      {isCalculating && (
        <div className="calculating-overlay">
          <div className="spinner"></div>
          <p>计算中... (复杂算法可能导致主线程阻塞)</p>
        </div>
      )}
      
      <div 
        className="composition-area"
        style={{ width: `${lineWidth + 40}px` }}
      >
        <div className="baseline-grid">
          {lines.map((_, index) => (
            <div
              key={index}
              className="baseline-line"
              style={{
                top: `${index * lineSpacing}px`,
                transform: `scaleY(${0.8 + Math.sin(baselineWave + index * 0.5) * 0.2})`,
              }}
            />
          ))}
        </div>
        
        {candidatePaths.length > 0 && (
          <div className="candidate-paths">
            {candidatePaths.map((path, index) => (
              <div
                key={index}
                className="candidate-path"
                style={{
                  left: `${path.start * 10}px`,
                  width: `${(path.end - path.start) * 10}px`,
                  opacity: 1 - path.cost / 150,
                }}
              />
            ))}
          </div>
        )}
        
        <div className="spring-indicator" style={{ transform: `scaleY(${0.8 + springTension * 0.4})` }} />
        
        {lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className={`typeset-line ${animatingLine === lineIndex ? "entering" : ""}`}
            style={{ top: `${lineIndex * lineSpacing}px` }}
          >
            {line.characters.map((char, charIndex) => {
              const pos = line.positions[charIndex];
              const metric = getGlyphMetrics(char, fontSize);
              const inkEffect = inkSpreading.find(i => i.charIndex === lineIndex * line.characters.length + charIndex);
              
              return (
                <div
                  key={`${lineIndex}-${charIndex}`}
                  className="glyph-container"
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y - (lineIndex * lineSpacing)}px`,
                    width: `${metric.width}px`,
                    height: `${metric.height}px`,
                  }}
                  onClick={() => handleCharClick(lineIndex * line.characters.length + charIndex)}
                >
                  <div
                    className={`glyph ${inkEffect ? "ink-spreading" : ""}`}
                    style={{
                      fontSize: `${fontSize * 20}px`,
                      filter: inkEffect ? `drop-shadow(0 0 ${inkEffect.intensity * 20}px rgba(0,0,0,0.5))` : "none",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </div>
                  {inkEffect && (
                    <div
                      className="ink-blur"
                      style={{
                        opacity: inkEffect.intensity,
                        transform: `scale(${1 + inkEffect.intensity * 0.5})`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        {text && lines.length === 0 && !isCalculating && (
          <div className="empty-state">
            <p>点击左侧字盘选择铅字</p>
          </div>
        )}
      </div>
      
      <style>{`
        .composition-preview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .preview-title {
          color: #333;
          font-size: 18px;
          margin: 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #8B4513;
        }
        
        .composition-area {
          position: relative;
          min-height: 400px;
          background: linear-gradient(180deg, #F5DEB3 0%, #DEB887 100%);
          border: 4px solid #8B4513;
          border-radius: 4px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
          align-self: flex-start;
        }
        
        .baseline-grid {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .baseline-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(139, 69, 19, 0.3);
          transition: transform 0.1s ease;
        }
        
        .candidate-paths {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
        }
        
        .candidate-path {
          position: absolute;
          top: 50%;
          height: 4px;
          background: rgba(255, 0, 0, 0.3);
          border-radius: 2px;
          animation: pulse 0.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        .spring-indicator {
          position: absolute;
          right: -20px;
          top: 50%;
          width: 8px;
          height: 100px;
          background: linear-gradient(90deg, #8B4513, #D2691E);
          border-radius: 4px;
          transform-origin: center top;
          transition: transform 0.03s ease;
        }
        
        .typeset-line {
          position: absolute;
          left: 20px;
          display: flex;
          align-items: flex-end;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .typeset-line.entering {
          animation: lineEnter 0.3s ease-out;
        }
        
        @keyframes lineEnter {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .glyph-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .glyph-container:hover {
          transform: scale(1.1);
          z-index: 20;
        }
        
        .glyph {
          font-family: "SimSun", "STSong", serif;
          color: #1a1a1a;
          line-height: 1;
          transition: filter 0.3s ease;
          position: relative;
          z-index: 1;
        }
        
        .glyph.ink-spreading {
          animation: inkSpread 0.5s ease-out;
        }
        
        @keyframes inkSpread {
          0% {
            filter: drop-shadow(0 0 0 rgba(0,0,0,0));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(0,0,0,0.6));
          }
          100% {
            filter: drop-shadow(0 0 25px rgba(0,0,0,0.3));
          }
        }
        
        .ink-blur {
          position: absolute;
          inset: -10px;
          background: radial-gradient(circle, rgba(0,0,0,0.3) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          transition: opacity 0.1s ease, transform 0.1s ease;
        }
        
        .empty-state {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B4513;
          font-size: 16px;
        }
        
        .calculating-overlay {
          position: absolute;
          inset: 0;
          background: rgba(210, 105, 30, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          gap: 16px;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #F5DEB3;
          border-top-color: #8B4513;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .calculating-overlay p {
          color: #F5DEB3;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
