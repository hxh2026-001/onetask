'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChronoMazeScene } from '@/components/ChronoMazeScene';
import { ControlPanel } from '@/components/ControlPanel';
import { InfoPanel } from '@/components/InfoPanel';
import { AnimationManager } from '@/components/AnimationManager';
import type { MazeState, CalendarDate, PathResult, PresetId } from '@/lib/types';
import { DEFAULT_MAZE_STATE, PRESETS } from '@/lib/constants';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ChronoMazeScene | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const [mazeState, setMazeState] = useState<MazeState>(DEFAULT_MAZE_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [selectedDate, setSelectedDate] = useState<CalendarDate>({
    year: 2024,
    month: 1,
    day: 1,
    calendar: 'gregorian'
  });
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [initError, setInitError] = useState<string | null>(null);

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `[${time}] ${message}`]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && !sceneRef.current) {
        try {
          console.log('Initializing ChronoMazeScene...');
          sceneRef.current = new ChronoMazeScene(containerRef.current);
          sceneRef.current.init();
          animationManagerRef.current = new AnimationManager(sceneRef.current);
          sceneRef.current.updateMazeState(DEFAULT_MAZE_STATE);
          console.log('ChronoMazeScene initialized successfully');
          setIsLoading(false);
        } catch (e) {
          console.error('Failed to initialize scene:', e);
          setInitError((e as Error).message);
          setIsLoading(false);
        }
      } else if (!containerRef.current) {
        console.log('Container not ready, will retry...');
      }
    }, 100);

    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setApiStatus('online');
          addLog('✓ API 服务已连接');
        } else {
          setApiStatus('offline');
          addLog('✗ API 服务连接失败，使用本地模式');
        }
      } catch {
        setApiStatus('offline');
        addLog('✗ API 服务连接失败，使用本地模式');
      }
    };
    checkApi();
  }, [addLog]);

  useEffect(() => {
    if (sceneRef.current && !isLoading) {
      sceneRef.current.updateMazeState(mazeState);
    }
  }, [mazeState, isLoading]);

  const loadPreset = async (presetId: PresetId) => {
    const preset = PRESETS[presetId];
    if (!preset) return;

    addLog(`加载预设: ${preset.name}`);
    animationManagerRef.current?.triggerDissolve();

    if (apiStatus === 'online') {
      try {
        const res = await fetch(`/api/maze/preset/${presetId}`);
        if (res.ok) {
          const data = await res.json();
          setMazeState(data.state);
          addLog(`✓ 预设已加载: ${data.state.unlockedNodes.length} 个节点`);
          return;
        }
      } catch (e) {
        addLog('使用本地预设数据');
      }
    }

    setMazeState(preset.state);
    addLog(`✓ 本地预设已加载`);
  };

  const convertDate = async () => {
    addLog(`转换日期: ${selectedDate.year}-${selectedDate.month}-${selectedDate.day} (${selectedDate.calendar})`);

    if (apiStatus === 'online') {
      try {
        const res = await fetch('/api/calendar/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate })
        });
        if (res.ok) {
          const data = await res.json();
          addLog(`转换结果: ${JSON.stringify(data.conversions)}`);
          if (sceneRef.current) {
            sceneRef.current.highlightDate(data.conversions);
            animationManagerRef.current?.triggerHeartbeat();
          }
          return;
        }
      } catch (e) {
        addLog('API 转换失败');
      }
    }

    const localConversions = {
      gregorian: { year: selectedDate.year, month: selectedDate.month, day: selectedDate.day },
      lunar: { year: selectedDate.year - 2, month: (selectedDate.month + 6) % 12 + 1, day: selectedDate.day },
      mayan: { baktun: 13, katun: 0, tun: 0, uinal: 0, kin: Math.floor(selectedDate.day * 1.5) },
      persian: { year: selectedDate.year - 622, month: ((selectedDate.month + 9) % 12) + 1, day: selectedDate.day }
    };
    addLog(`本地转换: ${JSON.stringify(localConversions)}`);
    if (sceneRef.current) {
      sceneRef.current.highlightDate(localConversions);
      animationManagerRef.current?.triggerHeartbeat();
    }
  };

  const findPath = async () => {
    addLog('求解最短路径...');

    if (apiStatus === 'online') {
      try {
        const res = await fetch('/api/maze/path', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: mazeState.currentNode, to: mazeState.targetNode })
        });
        if (res.ok) {
          const data = await res.json();
          setPathResult(data);
          addLog(`路径长度: ${data.path.length} 步, 成本: ${data.cost}`);
          if (sceneRef.current && animationManagerRef.current) {
            sceneRef.current.animatePath(data.path, () => {
              animationManagerRef.current?.triggerTrail();
            });
          }
          return;
        }
      } catch (e) {
        addLog('API 寻路失败');
      }
    }

    const localPath = {
      path: ['node_0', 'node_1', 'node_2', 'node_3', 'target'],
      cost: 42.5,
      warnings: ['时区偏移: +8 小时', '历法冲突: 农历闰月差异']
    };
    setPathResult(localPath);
    addLog(`本地路径: ${localPath.path.length} 步, 成本: ${localPath.cost}`);
    if (sceneRef.current && animationManagerRef.current) {
      sceneRef.current.animatePath(localPath.path, () => {
        animationManagerRef.current?.triggerTrail();
      });
    }
  };

  const triggerSweep = () => {
    addLog('触发光影扫掠动画');
    animationManagerRef.current?.triggerSweep();
  };

  const triggerMosaic = () => {
    addLog('触发马赛克破碎动画（模拟坐标转换错误）');
    animationManagerRef.current?.triggerMosaic();
  };

  const observeTimezoneEffect = () => {
    addLog('观察时区偏移效应: UTC+8 vs UTC-5');
    if (sceneRef.current) {
      sceneRef.current.demonstrateTimezoneOffset();
    }
  };

  const observeLoopEffect = () => {
    addLog('观察历法规则死循环效应');
    if (sceneRef.current) {
      sceneRef.current.demonstrateEndlessLoop();
    }
  };

  const observePrecisionEffect = () => {
    addLog('观察大跨度时间浮点精度丢失');
    if (sceneRef.current) {
      sceneRef.current.demonstratePrecisionLoss();
    }
  };

  const observeOverwriteEffect = () => {
    addLog('观察多人修改路径覆盖效应');
    if (sceneRef.current) {
      sceneRef.current.demonstratePathOverwrite();
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        background: '#0a0a1a',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 48,
            color: '#4a9eff',
            animation: 'pulse 2s infinite'
          }}>⏳</div>
          <p style={{ marginTop: 20, color: '#a0a0b0' }}>
            正在初始化时间迷宫...
          </p>
          {initError && (
            <p style={{ marginTop: 10, color: '#ff4757', fontSize: 12 }}>
              错误: {initError}
            </p>
          )}
          <button
            onClick={() => setIsLoading(false)}
            style={{
              marginTop: 20,
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #4a9eff',
              borderRadius: 6,
              color: '#4a9eff',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            跳过加载
          </button>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex' }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minWidth: 300,
          minHeight: 300
        }}
      />

      <ControlPanel
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onConvert={convertDate}
        onFindPath={findPath}
        onLoadPreset={loadPreset}
        onTriggerSweep={triggerSweep}
        onTriggerMosaic={triggerMosaic}
        apiStatus={apiStatus}
        presets={PRESETS}
      />

      <InfoPanel
        mazeState={mazeState}
        pathResult={pathResult}
        logs={logs}
        onObserveTimezone={observeTimezoneEffect}
        onObserveLoop={observeLoopEffect}
        onObservePrecision={observePrecisionEffect}
        onObserveOverwrite={observeOverwriteEffect}
      />
    </div>
  );
}
