import { useState, useEffect, useRef } from 'react';
import { Globe, Calendar, MapPin, RotateCw, Sparkles, Sun, Moon, Star } from 'lucide-react';

interface ControlPanelProps {
  latitude: number;
  setLatitude: (lat: number) => void;
  date: Date;
  setDate: (date: Date) => void;
  zodiacSign: string;
  obliquity: number;
  onPresetSelect: (preset: number) => void;
  fps: number;
  precessionOffset: number;
}

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
}

function AnimatedNumber({ value, decimals = 2, suffix = '' }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <span className="tabular-nums">
      {displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

export default function ControlPanel({
  latitude,
  setLatitude,
  date,
  setDate,
  zodiacSign,
  obliquity,
  onPresetSelect,
  fps,
  precessionOffset,
}: ControlPanelProps) {
  const [isLeapYear, setIsLeapYear] = useState(false);
  const [isGregorian, setIsGregorian] = useState(true);

  useEffect(() => {
    const year = date.getFullYear();
    setIsLeapYear(
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    );

    const julianDay = calculateJulianDay(date);
    setIsGregorian(julianDay >= 2299161.0);
  }, [date]);

  const calculateJulianDay = (d: Date): number => {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();

    let Y = year;
    let M = month;

    if (M <= 2) {
      Y -= 1;
      M += 12;
    }

    const A = Math.floor(Y / 100);
    const B = 2 - A + Math.floor(A / 4);

    return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + day + B - 1524.5 + hours / 24;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setDate(newDate);
  };

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLatitude(parseFloat(e.target.value));
  };

  const handleYearChange = (delta: number) => {
    const newYear = date.getFullYear() + delta;
    const newDate = new Date(newYear, date.getMonth(), date.getDate());
    setDate(newDate);
  };

  const zodiacColors: Record<string, string> = {
    Aries: 'from-red-500 to-orange-500',
    Taurus: 'from-orange-500 to-yellow-500',
    Gemini: 'from-yellow-500 to-green-500',
    Cancer: 'from-green-500 to-teal-500',
    Leo: 'from-amber-500 to-orange-500',
    Virgo: 'from-teal-500 to-cyan-500',
    Libra: 'from-cyan-500 to-blue-500',
    Scorpius: 'from-purple-500 to-pink-500',
    Sagittarius: 'from-pink-500 to-red-500',
    Capricornus: 'from-indigo-500 to-purple-500',
    Aquarius: 'from-blue-500 to-cyan-500',
    Pisces: 'from-violet-500 to-purple-500',
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">天文观测仪</h2>
          <p className="text-sm text-slate-400">Ancient Astrolabe Simulator</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <MapPin className="w-4 h-4" />
            观测纬度
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-90"
              max="90"
              value={latitude}
              onChange={handleLatitudeChange}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-lg font-mono text-cyan-400 w-16 text-right">
              <AnimatedNumber value={latitude} decimals={1} suffix="°" />
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar className="w-4 h-4" />
            观测日期
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleYearChange(-1)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <span className="text-white text-lg">-</span>
            </button>
            <input
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleYearChange(1)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <span className="text-white text-lg">+</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            {isGregorian ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-xs text-slate-400">历法</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {isGregorian ? '格里高利历' : '儒略历'}
          </p>
          {!isGregorian && date.getFullYear() >= 1582 && date.getMonth() + 1 === 10 && date.getDate() >= 5 && date.getDate() <= 14 && (
            <p className="text-xs text-red-400 mt-1">⚠️ 日期跨越跳变</p>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">闰年</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {isLeapYear ? '是' : '否'}
          </p>
        </div>
      </div>

      <div className={`bg-gradient-to-r ${zodiacColors[zodiacSign] || 'from-gray-500 to-gray-600'} rounded-xl p-4 mb-6 border border-yellow-500/30`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/70">当前黄道十二宫</p>
            <p className="text-xl font-bold text-white">{zodiacSign}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-white/60">黄赤交角</p>
            <p className="text-sm font-mono text-white">
              <AnimatedNumber value={obliquity} decimals={4} suffix="°" />
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60">岁差累积</p>
            <p className="text-sm font-mono text-white">
              <AnimatedNumber value={precessionOffset} decimals={2} suffix="°" />
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-300">预设场景</span>
          <span className="text-xs text-slate-500">点击加载</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPresetSelect(1)}
            className="group relative p-3 bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 border border-cyan-500/30 rounded-xl hover:from-cyan-500/30 hover:to-cyan-700/30 hover:border-cyan-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm font-medium text-white">预设一</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">北极点极昼</p>
          </button>

          <button
            onClick={() => onPresetSelect(2)}
            className="group relative p-3 bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl hover:from-amber-500/30 hover:to-amber-700/30 hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-medium text-white">预设二</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-amber-300 transition-colors">赤道正午投影</p>
          </button>

          <button
            onClick={() => onPresetSelect(3)}
            className="group relative p-3 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-purple-700/30 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-sm font-medium text-white">预设三</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-purple-300 transition-colors">黄赤交角极值</p>
          </button>

          <button
            onClick={() => onPresetSelect(4)}
            className="group relative p-3 bg-gradient-to-br from-pink-600/20 to-pink-800/20 border border-pink-500/30 rounded-xl hover:from-pink-500/30 hover:to-pink-700/30 hover:border-pink-500/50 transition-all duration-300"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-sm font-medium text-white">预设四</span>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-pink-300 transition-colors">岁差累积偏移</p>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">渲染帧率</span>
        </div>
        <span className={`text-lg font-mono ${fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
          <AnimatedNumber value={fps} decimals={0} suffix=" FPS" />
        </span>
      </div>
    </div>
  );
}