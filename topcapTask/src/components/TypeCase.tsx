import { useState, useRef, useEffect } from "react";
import { typeCaseCharacters } from "../data/presets";

interface TypeCaseProps {
  onCharacterSelect: (char: string) => void;
}

export function TypeCase({ onCharacterSelect }: TypeCaseProps) {
  const [fallingChar, setFallingChar] = useState<{ char: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCharClick = (char: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setFallingChar({
        char,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      });
    }
    
    setTimeout(() => {
      setFallingChar(null);
      onCharacterSelect(char);
    }, 600);
  };

  useEffect(() => {
    if (fallingChar) {
      const timer = setTimeout(() => setFallingChar(null), 600);
      return () => clearTimeout(timer);
    }
  }, [fallingChar]);

  return (
    <div ref={containerRef} className="type-case">
      <h3 className="type-case-title">虚拟字盘</h3>
      <div className="type-grid">
        {typeCaseCharacters.map((char, index) => (
          <button
            key={`${char}-${index}`}
            className="glyph-button"
            onClick={(e) => handleCharClick(char, e)}
          >
            {char === " " ? "\u00A0" : char}
          </button>
        ))}
      </div>
      
      {fallingChar && (
        <div
          className="falling-glyph"
          style={{
            left: fallingChar.x,
            top: fallingChar.y,
          }}
        >
          {fallingChar.char === " " ? "\u00A0" : fallingChar.char}
        </div>
      )}
      
      <style>{`
        .type-case {
          background: linear-gradient(145deg, #8B4513, #654321);
          border-radius: 8px;
          padding: 16px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.3);
          position: relative;
          overflow: hidden;
        }
        
        .type-case-title {
          color: #DEB887;
          font-size: 18px;
          margin: 0 0 12px 0;
          text-align: center;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        
        .type-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
        }
        
        .glyph-button {
          width: 32px;
          height: 40px;
          font-size: 16px;
          background: linear-gradient(180deg, #D2691E, #CD853F);
          border: 1px solid #8B4513;
          border-radius: 4px;
          color: #F5DEB3;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .glyph-button:hover {
          background: linear-gradient(180deg, #F4A460, #D2691E);
          transform: translateY(-2px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4);
        }
        
        .glyph-button:active {
          transform: translateY(1px);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .falling-glyph {
          position: absolute;
          font-size: 24px;
          color: #FFD700;
          font-weight: bold;
          pointer-events: none;
          animation: fall 0.6s ease-in forwards;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          transform: translateX(-50%);
        }
        
        @keyframes fall {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) rotate(0deg);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(300px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}
