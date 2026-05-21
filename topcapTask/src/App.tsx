import { useState, useEffect, useCallback } from "react";
import { TypeCase } from "./components/TypeCase";
import { CompositionPreview } from "./components/CompositionPreview";
import { ControlPanel } from "./components/ControlPanel";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { Preset } from "./data/presets";

export default function App() {
  const [text, setText] = useState("");
  const [lineWidth, setLineWidth] = useState(400);
  const [fontSize, setFontSize] = useState(1.0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineSpacing, setLineSpacing] = useState(160);
  const [simulatePerformanceIssues, setSimulatePerformanceIssues] = useState(false);

  const handleCharacterSelect = useCallback((char: string) => {
    setText(prev => prev + char);
  }, []);

  const handlePresetLoad = useCallback((preset: Preset) => {
    setText(preset.text);
    setLineWidth(preset.lineWidth);
    setFontSize(preset.fontSize);
    setLetterSpacing(preset.letterSpacing);
    setLineSpacing(preset.lineSpacing);
  }, []);

  const handleClear = useCallback(() => {
    setText("");
  }, []);

  useEffect(() => {
    if (text.length > 0) {
      fetch('/api/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          settings: {
            lineWidth,
            fontSize,
            letterSpacing,
            lineSpacing,
          },
        }),
      }).catch(error => {
        console.error("Failed to save composition:", error);
      });
    }
  }, [text, lineWidth, fontSize, letterSpacing, lineSpacing]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">金属活字印刷排版模拟系统</h1>
        <p className="app-subtitle">Knuth-Plass 换行算法演示</p>
      </header>
      
      <div className="main-content">
        <aside className="left-panel">
          <TypeCase onCharacterSelect={handleCharacterSelect} />
          <div className="char-input">
            <textarea
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此输入文本或从字盘选择铅字..."
            />
          </div>
        </aside>
        
        <main className="center-panel">
          <CompositionPreview
            text={text}
            lineWidth={lineWidth}
            fontSize={fontSize}
            letterSpacing={letterSpacing}
            lineSpacing={lineSpacing}
            simulatePerformanceIssues={simulatePerformanceIssues}
          />
        </main>
        
        <aside className="right-panel">
          <ControlPanel
            lineWidth={lineWidth}
            fontSize={fontSize}
            letterSpacing={letterSpacing}
            lineSpacing={lineSpacing}
            simulatePerformanceIssues={simulatePerformanceIssues}
            onLineWidthChange={setLineWidth}
            onFontSizeChange={setFontSize}
            onLetterSpacingChange={setLetterSpacing}
            onLineSpacingChange={setLineSpacing}
            onSimulatePerformanceIssuesChange={setSimulatePerformanceIssues}
            onPresetLoad={handlePresetLoad}
            onClear={handleClear}
          />
          <PerformanceMonitor />
        </aside>
      </div>
      
      <footer className="app-footer">
        <p>基于 Knuth-Plass 算法的排版引擎 | SQLite 数据持久化</p>
      </footer>
      
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: "SimSun", "STSong", "Times New Roman", serif;
          background: linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%);
          min-height: 100vh;
        }
        
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        .app-header {
          background: linear-gradient(145deg, #8B4513, #654321);
          color: #F5DEB3;
          padding: 20px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .app-title {
          font-size: 32px;
          margin: 0 0 8px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .app-subtitle {
          font-size: 16px;
          margin: 0;
          opacity: 0.8;
        }
        
        .main-content {
          flex: 1;
          display: flex;
          gap: 20px;
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }
        
        .left-panel {
          width: 340px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .char-input {
          background: rgba(255,255,255,0.8);
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .text-input {
          width: 100%;
          height: 120px;
          padding: 10px;
          border: 2px solid #8B4513;
          border-radius: 4px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
          background: #FFF8DC;
        }
        
        .center-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          overflow: auto;
        }
        
        .right-panel {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .app-footer {
          background: #654321;
          color: #DEB887;
          padding: 12px;
          text-align: center;
          font-size: 14px;
        }
        
        @media (max-width: 1200px) {
          .main-content {
            flex-direction: column;
          }
          
          .left-panel,
          .right-panel {
            width: 100%;
          }
          
          .center-panel {
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
