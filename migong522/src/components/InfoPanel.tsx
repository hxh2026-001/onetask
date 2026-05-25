'use client';

import { useState } from 'react';
import type { MazeState, PathResult } from '@/lib/types';
import { CALENDAR_NAMES } from '@/lib/constants';

interface InfoPanelProps {
  mazeState: MazeState;
  pathResult: PathResult | null;
  logs: string[];
  onObserveTimezone: () => void;
  onObserveLoop: () => void;
  onObservePrecision: () => void;
  onObserveOverwrite: () => void;
}

export function InfoPanel({
  mazeState,
  pathResult,
  logs,
  onObserveTimezone,
  onObserveLoop,
  onObservePrecision,
  onObserveOverwrite
}: InfoPanelProps) {
  const [activeSection, setActiveSection] = useState<'status' | 'path' | 'observe' | 'logs'>('status');

  const currentNode = mazeState.layout.nodes.find(n => n.id === mazeState.currentNode);
  const targetNode = mazeState.layout.nodes.find(n => n.id === mazeState.targetNode);

  return (
    <div style={{
      width: 340,
      height: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)',
      borderRight: '1px solid #2a2a4e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #2a2a4e'
      }}>
        <h2 style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#e8e8f0'
        }}>
          📊 信息面板
        </h2>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #2a2a4e'
      }}>
        {(['status', 'path', 'observe', 'logs'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              background: activeSection === section ? '#2a2a4e' : 'transparent',
              color: activeSection === section ? '#4a9eff' : '#a0a0c0',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: activeSection === section ? 600 : 400,
              borderBottom: activeSection === section ? '2px solid #4a9eff' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {section === 'status' ? '状态' : section === 'path' ? '路径' : section === 'observe' ? '观察' : '日志'}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px'
      }}>
        {activeSection === 'status' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: '12px',
              borderRadius: 8,
              background: 'rgba(74, 158, 255, 0.1)',
              border: '1px solid rgba(74, 158, 255, 0.3)'
            }}>
              <div style={{ fontSize: 11, color: '#606080', marginBottom: 4 }}>当前节点</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#4a9eff' }}>
                {currentNode?.label || '未知'}
              </div>
              <div style={{ fontSize: 11, color: '#a0a0c0', marginTop: 4 }}>
                公历: {currentNode?.coordinates.gregorian.year}-
                {currentNode?.coordinates.gregorian.month}-
                {currentNode?.coordinates.gregorian.day}
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 8,
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <div style={{ fontSize: 11, color: '#606080', marginBottom: 4 }}>目标节点</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#ffd700' }}>
                {targetNode?.label || '未知'}
              </div>
              <div style={{ fontSize: 11, color: '#a0a0c0', marginTop: 4 }}>
                公历: {targetNode?.coordinates.gregorian.year}-
                {targetNode?.coordinates.gregorian.month}-
                {targetNode?.coordinates.gregorian.day}
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 8,
              background: 'rgba(42, 42, 78, 0.5)',
              border: '1px solid #2a2a4e'
            }}>
              <div style={{ fontSize: 11, color: '#606080', marginBottom: 8 }}>迷宫统计</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#e8e8f0' }}>
                    {mazeState.layout.nodes.length}
                  </div>
                  <div style={{ fontSize: 10, color: '#606080' }}>总节点数</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2ecc71' }}>
                    {mazeState.unlockedNodes.length}
                  </div>
                  <div style={{ fontSize: 10, color: '#606080' }}>已解锁</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#9b59b6' }}>
                    {mazeState.layout.connections.length}
                  </div>
                  <div style={{ fontSize: 10, color: '#606080' }}>连接数</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#4a9eff' }}>
                    {CALENDAR_NAMES[mazeState.activeCalendar]}
                  </div>
                  <div style={{ fontSize: 10, color: '#606080' }}>当前历法</div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 8,
              background: 'rgba(42, 42, 78, 0.5)',
              border: '1px solid #2a2a4e'
            }}>
              <div style={{ fontSize: 11, color: '#606080', marginBottom: 8 }}>已发现规则</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {mazeState.discoveredRules.map(rule => (
                  <span
                    key={rule}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: 'rgba(74, 158, 255, 0.2)',
                      color: '#4a9eff',
                      fontSize: 10
                    }}
                  >
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'path' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pathResult ? (
              <>
                <div style={{
                  padding: '12px',
                  borderRadius: 8,
                  background: 'rgba(46, 204, 113, 0.1)',
                  border: '1px solid rgba(46, 204, 113, 0.3)'
                }}>
                  <div style={{ fontSize: 11, color: '#606080', marginBottom: 4 }}>路径成本</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2ecc71' }}>
                    {pathResult.cost.toFixed(2)}
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: 8,
                  background: 'rgba(42, 42, 78, 0.5)',
                  border: '1px solid #2a2a4e'
                }}>
                  <div style={{ fontSize: 11, color: '#606080', marginBottom: 8 }}>路径节点</div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    fontSize: 10
                  }}>
                    {pathResult.path.map((node, index) => (
                      <span key={node} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          padding: '4px 6px',
                          borderRadius: 4,
                          background: 'rgba(74, 158, 255, 0.2)',
                          color: '#4a9eff'
                        }}>
                          {node}
                        </span>
                        {index < pathResult.path.length - 1 && (
                          <span style={{ color: '#606080' }}>→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {pathResult.warnings.length > 0 && (
                  <div style={{
                    padding: '12px',
                    borderRadius: 8,
                    background: 'rgba(255, 165, 2, 0.1)',
                    border: '1px solid rgba(255, 165, 2, 0.3)'
                  }}>
                    <div style={{ fontSize: 11, color: '#606080', marginBottom: 8 }}>警告</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {pathResult.warnings.map((warning, index) => (
                        <div key={index} style={{ fontSize: 11, color: '#ffa502' }}>
                          ⚠ {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#606080'
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🧭</div>
                <div style={{ fontSize: 13 }}>点击"求解最短路径"开始探索</div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'observe' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#a0a0c0', marginBottom: 8 }}>
              观察时间迷宫中的各种系统效应
            </p>

            <button
              onClick={onObserveTimezone}
              style={{
                padding: '12px',
                border: '1px solid #2a2a4e',
                borderRadius: 8,
                background: 'rgba(74, 158, 255, 0.1)',
                color: '#4a9eff',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              🌍 时区偏移效应
              <div style={{ fontSize: 10, color: '#606080', marginTop: 4, fontWeight: 400 }}>
                观察不同时区导致的路径偏移
              </div>
            </button>

            <button
              onClick={onObserveLoop}
              style={{
                padding: '12px',
                border: '1px solid #2a2a4e',
                borderRadius: 8,
                background: 'rgba(155, 89, 182, 0.1)',
                color: '#9b59b6',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              ♾ 历法死循环
              <div style={{ fontSize: 10, color: '#606080', marginTop: 4, fontWeight: 400 }}>
                观察历法规则冲突引发的死循环
              </div>
            </button>

            <button
              onClick={onObservePrecision}
              style={{
                padding: '12px',
                border: '1px solid #2a2a4e',
                borderRadius: 8,
                background: 'rgba(255, 165, 2, 0.1)',
                color: '#ffa502',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              🔢 浮点精度丢失
              <div style={{ fontSize: 10, color: '#606080', marginTop: 4, fontWeight: 400 }}>
                观察大跨度时间跳转造成的精度丢失
              </div>
            </button>

            <button
              onClick={onObserveOverwrite}
              style={{
                padding: '12px',
                border: '1px solid #2a2a4e',
                borderRadius: 8,
                background: 'rgba(255, 71, 87, 0.1)',
                color: '#ff4757',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              👥 路径覆盖效应
              <div style={{ fontSize: 10, color: '#606080', marginTop: 4, fontWeight: 400 }}>
                观察多人修改时间节点产生的路径覆盖
              </div>
            </button>
          </div>
        )}

        {activeSection === 'logs' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontFamily: 'monospace',
            fontSize: 11
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#606080', padding: 12 }}>暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    background: log.includes('✓') ? 'rgba(46, 204, 113, 0.1)' :
                              log.includes('✗') ? 'rgba(255, 71, 87, 0.1)' :
                              'rgba(42, 42, 78, 0.5)',
                    color: log.includes('✓') ? '#2ecc71' :
                           log.includes('✗') ? '#ff4757' : '#a0a0c0'
                  }}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
