'use client';

import { useState, useEffect, useCallback } from 'react';
import CelestialSphere from '@/components/CelestialSphere';
import ControlPanel from '@/components/ControlPanel';
import { stars as starData, constellationLines as lineData, type Star } from '@/lib/stars';
import { 
  calculateObliquity, 
  sunEclipticLongitude, 
  getZodiacSign,
  applyPrecession
} from '@/lib/astronomy';

interface ConstellationLine {
  constellation: string;
  star1_id: number;
  star2_id: number;
}

export default function Home() {
  const [stars] = useState<Star[]>(starData);
  const [constellationLines] = useState<ConstellationLine[]>(lineData);
  const [latitude, setLatitude] = useState(40.0);
  const [date, setDate] = useState(new Date());
  const [zodiacSign, setZodiacSign] = useState('Aries');
  const [obliquity, setObliquity] = useState(23.4393);
  const [precessionOffset, setPrecessionOffset] = useState(0);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const year = date.getFullYear();
    const epoch = year >= 2000 ? `J${year}` : `J2000`;
    
    const obliquityValue = calculateObliquity(epoch);
    setObliquity(obliquityValue);

    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const eclipticLongitude = sunEclipticLongitude(dayOfYear);
    const zodiac = getZodiacSign(eclipticLongitude);
    setZodiacSign(zodiac);

    const precession = applyPrecession(0, 0, 'J2000', epoch);
    setPrecessionOffset(precession.ra);
  }, [date]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handlePresetSelect = useCallback((preset: number) => {
    switch (preset) {
      case 1:
        setLatitude(90);
        setDate(new Date(2024, 5, 21));
        break;
      case 2:
        setLatitude(0);
        setDate(new Date(2024, 5, 21));
        break;
      case 3:
        setLatitude(23.44);
        setDate(new Date(2024, 11, 21));
        break;
      case 4:
        setLatitude(40);
        setDate(new Date(3024, 5, 21));
        break;
    }
  }, []);

  const handleAngleChange = useCallback((azimuth: number, altitude: number) => {
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-slate-950/50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
            古代天文观测仪模拟系统
          </h1>
          <p className="text-slate-400 text-lg">
            Ancient Astrolabe Simulation System
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 relative">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
              <div className="aspect-square">
                {stars.length > 0 && (
                  <CelestialSphere
                    stars={stars}
                    constellationLines={constellationLines}
                    latitude={latitude}
                    date={date}
                    onAngleChange={handleAngleChange}
                  />
                )}
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span className="text-xs text-slate-400">赤经/赤纬网格</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-xs text-slate-400">黄道面</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-xs text-slate-400">星座连线</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  拖拽旋转天球
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <ControlPanel
              latitude={latitude}
              setLatitude={setLatitude}
              date={date}
              setDate={setDate}
              zodiacSign={zodiacSign}
              obliquity={obliquity}
              onPresetSelect={handlePresetSelect}
              fps={fps}
              precessionOffset={precessionOffset}
            />
          </div>
        </div>

        <footer className="mt-8 text-center text-slate-500 text-sm">
          <p>基于 Next.js + Three.js + SQLite 构建</p>
          <p className="mt-1">球面三角学计算 · 岁差修正 · 黄道十二宫</p>
        </footer>
      </div>
    </div>
  );
}