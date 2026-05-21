import { useEffect, useRef, useState, useCallback } from 'react';
import { useDungeonStore } from '../store/dungeonStore';
import type { DungeonMap, TileType, Monster, Room, Corridor } from '../types';
import { checkConnectivity } from '../utils/algorithms';

interface AnimationProgress {
  roomIndex: number;
  corridorIndex: number;
  monsterIndex: number;
  fogReveal: number;
  connectivityProgress: number;
}

export function DungeonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { map, animationState, fogOfWar, showConnectivity } = useDungeonStore();
  const [animationProgress, setAnimationProgress] = useState<AnimationProgress>({
    roomIndex: 0,
    corridorIndex: 0,
    monsterIndex: 0,
    fogReveal: 0,
    connectivityProgress: 0,
  });
  
  const animationFrameRef = useRef<number>(0);
  const reachableTilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (map) {
      const result = checkConnectivity(map.tiles, map.rooms);
      reachableTilesRef.current = result.reachableTiles;
    }
  }, [map]);

  useEffect(() => {
    if (!map) {
      setAnimationProgress({
        roomIndex: 0,
        corridorIndex: 0,
        monsterIndex: 0,
        fogReveal: fogOfWar ? 0 : 1,
        connectivityProgress: 0,
      });
      return;
    }

    if (animationState === 'idle') {
      setAnimationProgress({
        roomIndex: map.rooms.length,
        corridorIndex: map.corridors.length,
        monsterIndex: map.monsters.length,
        fogReveal: fogOfWar ? 0 : 1,
        connectivityProgress: showConnectivity ? 1 : 0,
      });
      return;
    }

    const animate = () => {
      setAnimationProgress((prev) => {
        let newProgress = { ...prev };
        
        switch (animationState) {
          case 'carving':
            if (prev.roomIndex < map.rooms.length) {
              newProgress.roomIndex = Math.min(prev.roomIndex + 0.1, map.rooms.length);
            } else {
              newProgress.roomIndex = map.rooms.length;
            }
            break;
            
          case 'connecting':
            newProgress.roomIndex = map.rooms.length;
            if (prev.corridorIndex < map.corridors.length) {
              newProgress.corridorIndex = Math.min(prev.corridorIndex + 0.08, map.corridors.length);
            } else {
              newProgress.corridorIndex = map.corridors.length;
            }
            break;
            
          case 'placing':
            newProgress.roomIndex = map.rooms.length;
            newProgress.corridorIndex = map.corridors.length;
            if (prev.monsterIndex < map.monsters.length) {
              newProgress.monsterIndex = Math.min(prev.monsterIndex + 0.15, map.monsters.length);
            } else {
              newProgress.monsterIndex = map.monsters.length;
            }
            break;
            
          case 'revealing':
            newProgress.roomIndex = map.rooms.length;
            newProgress.corridorIndex = map.corridors.length;
            newProgress.monsterIndex = map.monsters.length;
            newProgress.fogReveal = Math.min(prev.fogReveal + 0.02, 1);
            break;
            
          case 'generating':
            newProgress.roomIndex = 0;
            newProgress.corridorIndex = 0;
            newProgress.monsterIndex = 0;
            break;
        }
        
        if (!showConnectivity) {
          newProgress.connectivityProgress = 0;
        }
        
        return newProgress;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState, map, fogOfWar, showConnectivity]);

  const drawTile = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, tile: TileType, size: number) => {
    const padding = 0.5;
    
    switch (tile) {
      case 'wall':
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(x * size + padding, y * size + padding, size - padding * 2, size - padding * 2);
        break;
      case 'floor':
        ctx.fillStyle = '#34495e';
        ctx.fillRect(x * size + padding, y * size + padding, size - padding * 2, size - padding * 2);
        break;
      case 'corridor':
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(x * size + padding, y * size + padding, size - padding * 2, size - padding * 2);
        break;
    }
  }, []);

  const drawRoom = useCallback((ctx: CanvasRenderingContext2D, room: Room, size: number, progress: number = 1) => {
    const gradient = ctx.createLinearGradient(
      room.x * size, room.y * size,
      (room.x + room.width) * size, (room.y + room.height) * size
    );
    gradient.addColorStop(0, '#1abc9c');
    gradient.addColorStop(1, '#16a085');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3 + progress * 0.7;
    
    ctx.fillRect(
      room.x * size,
      room.y * size,
      room.width * size * progress,
      room.height * size
    );
    
    ctx.strokeStyle = '#1abc9c';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      room.x * size,
      room.y * size,
      room.width * size,
      room.height * size
    );
    
    ctx.globalAlpha = 1;
  }, []);

  const drawCorridor = useCallback((ctx: CanvasRenderingContext2D, corridor: Corridor, size: number, progress: number = 1) => {
    const pointCount = Math.floor(corridor.points.length * progress);
    
    ctx.strokeStyle = '#f4d03f';
    ctx.lineWidth = size * 0.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    
    if (pointCount > 0) {
      ctx.moveTo(corridor.points[0].x * size + size / 2, corridor.points[0].y * size + size / 2);
      
      for (let i = 1; i < pointCount; i++) {
        ctx.lineTo(
          corridor.points[i].x * size + size / 2,
          corridor.points[i].y * size + size / 2
        );
      }
    }
    
    ctx.stroke();
  }, []);

  const drawMonster = useCallback((ctx: CanvasRenderingContext2D, monster: Monster, size: number, progress: number = 1) => {
    const centerX = monster.x * size + size / 2;
    const centerY = monster.y * size + size / 2;
    const radius = (size / 2 - 2) * progress;
    
    const colors: Record<string, string> = {
      goblin: '#2ecc71',
      skeleton: '#bdc3c7',
      orc: '#e67e22',
      dragon: '#e74c3c',
    };
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = colors[monster.type] || '#ffffff';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
    ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
  }, []);

  const drawFog = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, size: number, revealProgress: number) => {
    if (revealProgress >= 1) return;
    
    const centerX = width * size / 2;
    const centerY = height * size / 2;
    const maxRadius = Math.sqrt(width * width + height * height) * size;
    const currentRadius = maxRadius * revealProgress;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, currentRadius * 0.5,
      centerX, centerY, currentRadius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width * size, height * size);
  }, []);

  const drawConnectivity = useCallback((ctx: CanvasRenderingContext2D, map: DungeonMap, size: number, progress: number) => {
    if (progress <= 0) return;
    
    const reachable = reachableTilesRef.current;
    
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const key = `${x},${y}`;
        if (reachable.has(key)) {
          const alpha = 0.3 * progress;
          ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
          ctx.fillRect(x * size, y * size, size, size);
        } else if (map.tiles[y][x] !== 'wall') {
          const alpha = 0.3 * progress;
          ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
          ctx.fillRect(x * size, y * size, size, size);
        }
      }
    }
    
    for (let i = 0; i < map.rooms.length; i++) {
      const room = map.rooms[i];
      const isReachable = reachable.has(`${room.centerX},${room.centerY}`);
      
      ctx.strokeStyle = isReachable ? '#2ecc71' : '#e74c3c';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        room.x * size,
        room.y * size,
        room.width * size,
        room.height * size
      );
      ctx.setLineDash([]);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const tileSize = Math.min(Math.floor(canvas.width / map.width), Math.floor(canvas.height / map.height));
    const offsetX = (canvas.width - map.width * tileSize) / 2;
    const offsetY = (canvas.height - map.height * tileSize) / 2;
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, map.width * tileSize, map.height * tileSize);
    
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        drawTile(ctx, x, y, map.tiles[y][x], tileSize);
      }
    }
    
    const roomsToDraw = Math.floor(animationProgress.roomIndex);
    const partialRoomProgress = animationProgress.roomIndex - roomsToDraw;
    
    for (let i = 0; i < roomsToDraw; i++) {
      drawRoom(ctx, map.rooms[i], tileSize, 1);
    }
    
    if (partialRoomProgress > 0 && roomsToDraw < map.rooms.length) {
      drawRoom(ctx, map.rooms[roomsToDraw], tileSize, partialRoomProgress);
    }
    
    const corridorsToDraw = Math.floor(animationProgress.corridorIndex);
    const partialCorridorProgress = animationProgress.corridorIndex - corridorsToDraw;
    
    for (let i = 0; i < corridorsToDraw; i++) {
      drawCorridor(ctx, map.corridors[i], tileSize, 1);
    }
    
    if (partialCorridorProgress > 0 && corridorsToDraw < map.corridors.length) {
      drawCorridor(ctx, map.corridors[corridorsToDraw], tileSize, partialCorridorProgress);
    }
    
    const monstersToDraw = Math.floor(animationProgress.monsterIndex);
    const partialMonsterProgress = animationProgress.monsterIndex - monstersToDraw;
    
    for (let i = 0; i < monstersToDraw; i++) {
      drawMonster(ctx, map.monsters[i], tileSize, 1);
    }
    
    if (partialMonsterProgress > 0 && monstersToDraw < map.monsters.length) {
      drawMonster(ctx, map.monsters[monstersToDraw], tileSize, partialMonsterProgress);
    }
    
    drawConnectivity(ctx, map, tileSize, animationProgress.connectivityProgress);
    
    if (fogOfWar) {
      drawFog(ctx, map.width, map.height, tileSize, animationProgress.fogReveal);
    }
    
    ctx.restore();
  }, [map, animationProgress, fogOfWar, showConnectivity, drawTile, drawRoom, drawCorridor, drawMonster, drawFog, drawConnectivity]);

  if (!map) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🏰</div>
          <p className="text-gray-400 text-lg">点击「生成地牢」开始探索</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border-2 border-dungeon-blue rounded-lg shadow-lg shadow-dungeon-blue/30"
    />
  );
}
