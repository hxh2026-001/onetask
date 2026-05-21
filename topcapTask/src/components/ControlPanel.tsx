import { presets, type Preset } from "../data/presets";

interface ControlPanelProps {
  lineWidth: number;
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
  simulatePerformanceIssues: boolean;
  onLineWidthChange: (value: number) => void;
  onFontSizeChange: (value: number) => void;
  onLetterSpacingChange: (value: number) => void;
  onLineSpacingChange: (value: number) => void;
  onSimulatePerformanceIssuesChange: (value: boolean) => void;
  onPresetLoad: (preset: Preset) => void;
  onClear: () => void;
}

export function ControlPanel({
  lineWidth,
  fontSize,
  letterSpacing,
  lineSpacing,
  simulatePerformanceIssues,
  onLineWidthChange,
  onFontSizeChange,
  onLetterSpacingChange,
  onLineSpacingChange,
  onSimulatePerformanceIssuesChange,
  onPresetLoad,
  onClear,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      <h3 className="panel-title">排版控制</h3>
      
      <div className="preset-section">
        <h4>预设任务</h4>
        <div className="preset-buttons">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className="preset-button"
              onClick={() => onPresetLoad(preset)}
            >
              <span className="preset-name">{preset.name}</span>
              <span className="preset-desc">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="settings-section">
        <h4>排版参数</h4>
        
        <div className="setting-item">
          <label>栏宽: {lineWidth}px</label>
          <input
            type="range"
            min="80"
            max="800"
            value={lineWidth}
            onChange={(e) => onLineWidthChange(Number(e.target.value))}
          />
        </div>
        
        <div className="setting-item">
          <label>字号: {fontSize.toFixed(1)}em</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
          />
        </div>
        
        <div className="setting-item">
          <label>字间距: {letterSpacing}px</label>
          <input
            type="range"
            min="0"
            max="20"
            value={letterSpacing}
            onChange={(e) => onLetterSpacingChange(Number(e.target.value))}
          />
        </div>
        
        <div className="setting-item">
          <label>行距: {lineSpacing}px</label>
          <input
            type="range"
            min="80"
            max="300"
            value={lineSpacing}
            onChange={(e) => onLineSpacingChange(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="performance-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={simulatePerformanceIssues}
            onChange={(e) => onSimulatePerformanceIssuesChange(e.target.checked)}
          />
          <span>模拟性能问题</span>
        </label>
        <p className="warning-text">
          启用后会模拟复杂算法阻塞、稀有字形缺失、对齐错位和DOM性能瓶颈
        </p>
      </div>
      
      <button className="clear-button" onClick={onClear}>
        清空排版
      </button>
      
      <style>{`
        .control-panel {
          background: linear-gradient(145deg, #F5F5DC, #DEB887);
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .panel-title {
          color: #8B4513;
          font-size: 18px;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #D2691E;
        }
        
        .preset-section {
          margin-bottom: 20px;
        }
        
        .preset-section h4 {
          color: #654321;
          font-size: 14px;
          margin: 0 0 8px 0;
        }
        
        .preset-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .preset-button {
          padding: 10px 12px;
          background: linear-gradient(180deg, #FFF8DC, #DEB887);
          border: 2px solid #8B4513;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }
        
        .preset-button:hover {
          background: linear-gradient(180deg, #FFE4B5, #D2691E);
          transform: translateX(4px);
        }
        
        .preset-name {
          display: block;
          font-weight: bold;
          color: #8B4513;
          font-size: 14px;
        }
        
        .preset-desc {
          display: block;
          font-size: 11px;
          color: #654321;
          margin-top: 2px;
        }
        
        .settings-section {
          margin-bottom: 20px;
        }
        
        .settings-section h4 {
          color: #654321;
          font-size: 14px;
          margin: 0 0 12px 0;
        }
        
        .setting-item {
          margin-bottom: 12px;
        }
        
        .setting-item label {
          display: block;
          font-size: 12px;
          color: #654321;
          margin-bottom: 4px;
        }
        
        .setting-item input[type="range"] {
          width: 100%;
          height: 6px;
          background: #D2691E;
          border-radius: 3px;
          appearance: none;
          cursor: pointer;
        }
        
        .setting-item input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #8B4513;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .performance-section {
          margin-bottom: 16px;
          padding: 12px;
          background: rgba(255, 165, 0, 0.2);
          border-radius: 4px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          color: #8B4513;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .warning-text {
          font-size: 11px;
          color: #A0522D;
          margin: 8px 0 0 0;
          line-height: 1.4;
        }
        
        .clear-button {
          width: 100%;
          padding: 10px;
          background: linear-gradient(180deg, #CD5C5C, #8B0000);
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .clear-button:hover {
          background: linear-gradient(180deg, #DC143C, #8B0000);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
