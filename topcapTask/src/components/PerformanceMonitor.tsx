import { useState, useEffect } from "react";

export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFps);
    };
    
    const animationId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    const memoryInterval = setInterval(() => {
      if (performance && performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        setMemoryUsage(Number(usedMB));
      }
    }, 1000);
    
    return () => clearInterval(memoryInterval);
  }, []);

  useEffect(() => {
    const charInterval = setInterval(() => {
      const glyphContainers = document.querySelectorAll(".glyph-container");
      setCharCount(glyphContainers.length);
    }, 500);
    
    return () => clearInterval(charInterval);
  }, []);

  useEffect(() => {
    const renderInterval = setInterval(() => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const el = document.createElement("div");
        el.style.display = "none";
        document.body.appendChild(el);
        document.body.removeChild(el);
      }
      
      const end = performance.now();
      setRenderTime(end - start);
    }, 2000);
    
    return () => clearInterval(renderInterval);
  }, []);

  const getFpsColor = () => {
    if (fps >= 55) return "#228B22";
    if (fps >= 30) return "#FFD700";
    return "#DC143C";
  };

  return (
    <div className="performance-monitor">
      <h3 className="monitor-title">性能监控</h3>
      
      <div className="metrics">
        <div className="metric">
          <span className="metric-label">FPS</span>
          <span className="metric-value" style={{ color: getFpsColor() }}>{fps}</span>
        </div>
        
        <div className="metric">
          <span className="metric-label">内存</span>
          <span className="metric-value">{memoryUsage}MB</span>
        </div>
        
        <div className="metric">
          <span className="metric-label">渲染</span>
          <span className="metric-value">{renderTime.toFixed(2)}ms</span>
        </div>
        
        <div className="metric">
          <span className="metric-label">字符数</span>
          <span className="metric-value">{charCount}</span>
        </div>
      </div>
      
      <div className="status-bars">
        <div className="status-bar">
          <span>主线程阻塞</span>
          <div className="bar">
            <div 
              className="bar-fill" 
              style={{ width: `${Math.min(100, charCount * 2)}%` }}
            />
          </div>
        </div>
        
        <div className="status-bar">
          <span>DOM节点数</span>
          <div className="bar">
            <div 
              className="bar-fill dom" 
              style={{ width: `${Math.min(100, charCount * 1.5)}%` }}
            />
          </div>
        </div>
      </div>
      
      <style>{`
        .performance-monitor {
          background: linear-gradient(145deg, #2C2C2C, #1A1A1A);
          border-radius: 8px;
          padding: 16px;
          color: #F5DEB3;
        }
        
        .monitor-title {
          font-size: 14px;
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #444;
        }
        
        .metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .metric {
          background: rgba(255,255,255,0.05);
          padding: 8px;
          border-radius: 4px;
        }
        
        .metric-label {
          display: block;
          font-size: 10px;
          color: #888;
          margin-bottom: 4px;
        }
        
        .metric-value {
          font-size: 20px;
          font-weight: bold;
          font-family: monospace;
          color: #F5DEB3;
        }
        
        .status-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .status-bar {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-bar span {
          font-size: 10px;
          color: #888;
          width: 70px;
        }
        
        .bar {
          flex: 1;
          height: 6px;
          background: #333;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #228B22, #FFD700, #DC143C);
          transition: width 0.5s ease;
        }
        
        .bar-fill.dom {
          background: linear-gradient(90deg, #1E90FF, #9932CC);
        }
      `}</style>
    </div>
  );
}
