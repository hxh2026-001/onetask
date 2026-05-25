'use client';

import { useState } from 'react';
import type { CalendarDate, CalendarType, PresetId, Preset } from '@/lib/types';
import { CALENDAR_NAMES } from '@/lib/constants';

interface ControlPanelProps {
  selectedDate: CalendarDate;
  onDateChange: (date: CalendarDate) => void;
  onConvert: () => void;
  onFindPath: () => void;
  onLoadPreset: (presetId: PresetId) => void;
  onTriggerSweep: () => void;
  onTriggerMosaic: () => void;
  apiStatus: 'checking' | 'online' | 'offline';
  presets: Record<PresetId, Preset>;
}

export function ControlPanel({
  selectedDate,
  onDateChange,
  onConvert,
  onFindPath,
  onLoadPreset,
  onTriggerSweep,
  onTriggerMosaic,
  apiStatus,
  presets
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'date' | 'presets' | 'effects'>('date');

  const handleCalendarChange = (calendar: CalendarType) => {
    onDateChange({ ...selectedDate, calendar });
  };

  return (
    <div style={{
      width: 320,
      height: '100%',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)',
      borderLeft: '1px solid #2a2a4e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #2a2a4e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#e8e8f0'
        }}>
          ⚙ 控制面板
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: apiStatus === 'online' ? '#2ecc71' : apiStatus === 'offline' ? '#ff4757' : '#ffa502'
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: apiStatus === 'online' ? '#2ecc71' : apiStatus === 'offline' ? '#ff4757' : '#ffa502'
          }} />
          {apiStatus === 'online' ? '在线' : apiStatus === 'offline' ? '离线' : '检测中'}
        </div>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #2a2a4e'
      }}>
        {(['date', 'presets', 'effects'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background: activeTab === tab ? '#2a2a4e' : 'transparent',
              color: activeTab === tab ? '#4a9eff' : '#a0a0c0',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              borderBottom: activeTab === tab ? '2px solid #4a9eff' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab === 'date' ? '📅 日期' : tab === 'presets' ? '🎯 预设' : '✨ 特效'}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {activeTab === 'date' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                color: '#a0a0c0',
                marginBottom: 8
              }}>
                历法类型
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr', gap: 8 }}>
                {(['gregorian', 'lunar', 'mayan', 'persian'] as CalendarType[]).map(cal => (
                  <button
                    key={cal}
                    onClick={() => handleCalendarChange(cal)}
                    style={{
                      padding: '10px',
                      border: selectedDate.calendar === cal ? '2px solid #4a9eff' : '1px solid #2a2a4e',
                      borderRadius: 8,
                      background: selectedDate.calendar === cal ? 'rgba(74, 158, 255, 0.1)' : 'transparent',
                      color: selectedDate.calendar === cal ? '#4a9eff' : '#a0a0c0',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'all 0.2s'
                    }}
                  >
                    {CALENDAR_NAMES[cal]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#606080', marginBottom: 4 }}>
                  年
                </label>
                <input
                  type="number"
                  value={selectedDate.year}
                  onChange={e => onDateChange({ ...selectedDate, year: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #2a2a4e',
                    borderRadius: 6,
                    background: '#0f0f1e',
                    color: '#e8e8f0',
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#606080', marginBottom: 4 }}>
                  月
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={selectedDate.month}
                  onChange={e => onDateChange({ ...selectedDate, month: parseInt(e.target.value) || 1 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #2a2a4e',
                    borderRadius: 6,
                    background: '#0f0f1e',
                    color: '#e8e8f0',
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#606080', marginBottom: 4 }}>
                  日
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={selectedDate.day}
                  onChange={e => onDateChange({ ...selectedDate, day: parseInt(e.target.value) || 1 })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #2a2a4e',
                    borderRadius: 6,
                    background: '#0f0f1e',
                    color: '#e8e8f0',
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            <button
              onClick={onConvert}
              style={{
                padding: '14px',
                border: 'none',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4a9eff 0%, #6b7fff 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔄 转换历法坐标
            </button>

            <button
              onClick={onFindPath}
              style={{
                padding: '14px',
                border: 'none',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🧭 求解最短路径
            </button>
          </div>
        )}

        {activeTab === 'presets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#a0a0c0', marginBottom: 8 }}>
              选择预设迷宫布局进行探索
            </p>
            {Object.values(presets).map(preset => (
              <button
                key={preset.id}
                onClick={() => onLoadPreset(preset.id)}
                style={{
                  padding: '14px',
                  border: '1px solid #2a2a4e',
                  borderRadius: 10,
                  background: 'rgba(42, 42, 78, 0.5)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#e8e8f0',
                  marginBottom: 4
                }}>
                  {preset.name}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#a0a0c0',
                  lineHeight: 1.4
                }}>
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'effects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#a0a0c0', marginBottom: 8 }}>
              触发动画效果观察系统特性
            </p>

            <button
              onClick={onTriggerSweep}
              style={{
                padding: '14px',
                border: '1px solid #2a2a4e',
                borderRadius: 8,
                background: 'rgba(74, 158, 255, 0.1)',
                color: '#4a9eff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              🌊 时间流逝光影扫掠
            </button>

            <button
              onClick={onTriggerMosaic}
              style={{
                padding: '14px',
                border: '1px solid #2a2a4e',
                borderRadius: 8,
                background: 'rgba(255, 71, 87, 0.1)',
                color: '#ff4757',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              💔 坐标转换马赛克破碎
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
