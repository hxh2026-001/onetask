import { useDungeonStore } from '../store/dungeonStore';
import { checkConnectivity } from '../utils/algorithms';
import { useEffect, useState } from 'react';
import { MapPin, Users, GitBranch, Clock } from 'lucide-react';

export function StatsPanel() {
  const { map, animationState } = useDungeonStore();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (map) {
      const result = checkConnectivity(map.tiles, map.rooms);
      setIsConnected(result.connected);
    } else {
      setIsConnected(null);
    }
  }, [map]);

  const stats = map ? [
    {
      label: '房间数量',
      value: map.rooms.length,
      icon: MapPin,
      color: 'text-dungeon-green',
    },
    {
      label: '走廊数量',
      value: map.corridors.length,
      icon: GitBranch,
      color: 'text-dungeon-blue',
    },
    {
      label: '怪物数量',
      value: map.monsters.length,
      icon: Users,
      color: 'text-dungeon-red',
    },
    {
      label: '连通状态',
      value: isConnected === null ? '-' : isConnected ? '✓ 连通' : '✗ 断开',
      icon: Clock,
      color: isConnected === null ? 'text-gray-500' : isConnected ? 'text-dungeon-green' : 'text-dungeon-red',
    },
  ] : [];

  const animationMessages: Record<string, string> = {
    generating: '正在初始化地图...',
    carving: '正在雕刻房间...',
    connecting: '正在连接走廊...',
    placing: '正在放置怪物...',
    revealing: '正在揭开迷雾...',
    idle: '生成完成',
  };

  return (
    <div className="bg-dungeon-darker/80 backdrop-blur-sm rounded-xl p-6 border border-dungeon-blue/30 shadow-lg">
      <h2 className="text-xl font-bold text-dungeon-accent mb-4 flex items-center gap-2">
        <span>📊</span> 统计信息
      </h2>

      <div className="flex items-center gap-2 mb-4 p-3 bg-dungeon-dark/50 rounded-lg">
        <div className={`w-2 h-2 rounded-full ${
          animationState === 'idle' ? 'bg-dungeon-green' : 'bg-dungeon-accent animate-pulse'
        }`} />
        <span className="text-gray-300 text-sm">{animationMessages[animationState]}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-dungeon-dark/50 rounded-lg p-3 flex items-center gap-3"
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-gray-400 text-xs">{stat.label}</p>
              <p className={`font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {!map && (
        <div className="mt-4 p-3 bg-dungeon-dark/50 rounded-lg">
          <p className="text-gray-400 text-xs">
            <span className="text-dungeon-accent">📌</span> 
            生成地牢后将显示详细统计信息
          </p>
        </div>
      )}
    </div>
  );
}
