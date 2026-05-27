import { useEffect, useRef } from 'react';
import type { NFAResult, MatchResult } from '../../server/nfa';

interface NFAGraphProps {
  nfa: NFAResult | null;
  matchResult: MatchResult | null;
}

function NFAGraph({ nfa, matchResult }: NFAGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);

  useEffect(() => {
    if (!nfa) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const statePositions: Record<number, { x: number; y: number }> = {};
    const stateCount = nfa.states.length;
    const radius = Math.min(width, height) / 2 - 50;
    const centerX = width / 2;
    const centerY = height / 2;

    nfa.states.forEach((_, index) => {
      const angle = (2 * Math.PI * index) / stateCount - Math.PI / 2;
      statePositions[index] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    const activeStates = new Set(matchResult?.path.map(p => p.state) || []);
    const currentState = matchResult?.path[matchResult.path.length - 1]?.state;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      nfa.states.forEach((state, index) => {
        state.transitions.forEach(transition => {
          const from = statePositions[index];
          const to = statePositions[transition.target];
          if (!from || !to) return;

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(midX, midY);
          ctx.lineTo(to.x, to.y);
          
          if (activeStates.has(index) && activeStates.has(transition.target)) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
            ctx.lineWidth = 2;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
          }
          ctx.stroke();

          const arrowAngle = Math.atan2(to.y - midY, to.x - midX);
          const arrowLength = 10;
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(
            to.x - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
            to.y - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
          );
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(
            to.x - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
            to.y - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
          );
          ctx.stroke();

          if (transition.symbol !== null) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(transition.symbol, midX, midY - 5);
          } else {
            ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ε', midX, midY - 5);
          }
        });
      });

      nfa.states.forEach((state, index) => {
        const pos = statePositions[index];
        if (!pos) return;

        const isActive = activeStates.has(index);
        const isCurrent = currentState === index;
        const isAccept = state.isAccept;
        const isStart = index === nfa.startState;

        if (isActive) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
        
        if (isCurrent) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.fill();
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
        } else if (isAccept) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
          ctx.fill();
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
        } else if (isStart) {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.fill();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        if (isAccept) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`S${index}`, pos.x, pos.y);
      });

      if (matchResult?.trapDetected) {
        particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1;
          p.life -= 0.02;

          if (p.life > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239, 68, 68, ${p.life})`;
            ctx.fill();
          }
        });

        if (Math.random() < 0.5 && particlesRef.current.length < 50) {
          const pos = statePositions[currentState];
          if (pos) {
            particlesRef.current.push({
              x: pos.x,
              y: pos.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 1
            });
          }
        }

        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [nfa, matchResult]);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 h-full">
      <h3 className="text-white font-semibold mb-4">NFA 状态图</h3>
      
      {nfa ? (
        <>
          <div className="relative aspect-square">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="w-full h-full rounded-lg bg-black/30"
            />
          </div>
          
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-400">起始状态</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-green-500" />
              <span className="text-gray-400">接受状态</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400">当前状态</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-500" />
              <span className="text-gray-400">活跃路径</span>
            </div>
          </div>

          <div className="mt-4 bg-black/30 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-2">状态统计</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-white">状态数: {nfa.states.length}</div>
              <div className="text-white">接受状态: {nfa.acceptStates.length}</div>
              <div className="text-white">转移数: {nfa.states.reduce((acc, s) => acc + s.transitions.length, 0)}</div>
              <div className="text-white">起始状态: S{nfa.startState}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>输入正则表达式以生成状态图</p>
        </div>
      )}
    </div>
  );
}

export default NFAGraph;
