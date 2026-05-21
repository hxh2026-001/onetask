import type { Point, Room, Corridor, Monster, DungeonMap, BSPNode, GenerationParameters, TileType } from '../types';

let randomSeed = 42;

function setRandomSeed(seed: number) {
  randomSeed = seed;
}

function random(): number {
  randomSeed = (randomSeed * 1103515245 + 12345) & 0x7fffffff;
  return randomSeed / 0x7fffffff;
}

export function generateBSPTree(params: GenerationParameters): BSPNode {
  setRandomSeed(params.seed);
  
  function createNode(x: number, y: number, width: number, height: number, depth: number = 0): BSPNode {
    const node: BSPNode = {
      id: `node-${depth}-${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      width,
      height,
      isLeaf: false,
    };

    if (width < params.bspMinLeafSize * 2 || height < params.bspMinLeafSize * 2 || depth > 6) {
      node.isLeaf = true;
      node.room = createRoom(x, y, width, height);
      return node;
    }

    const splitVertical = random() > 0.5;
    
    if (splitVertical) {
      if (width < params.bspMinLeafSize * 2) {
        return createNode(x, y, width, height, depth + 1);
      }
      
      const splitX = Math.floor(x + params.bspMinLeafSize + random() * (width - params.bspMinLeafSize * 2));
      node.left = createNode(x, y, splitX - x, height, depth + 1);
      node.right = createNode(splitX, y, width - (splitX - x), height, depth + 1);
    } else {
      if (height < params.bspMinLeafSize * 2) {
        return createNode(x, y, width, height, depth + 1);
      }
      
      const splitY = Math.floor(y + params.bspMinLeafSize + random() * (height - params.bspMinLeafSize * 2));
      node.left = createNode(x, y, width, splitY - y, depth + 1);
      node.right = createNode(x, splitY, width, height - (splitY - y), depth + 1);
    }

    return node;
  }

  function createRoom(x: number, y: number, width: number, height: number): Room {
    const roomWidth = Math.floor(3 + random() * (width - 4));
    const roomHeight = Math.floor(3 + random() * (height - 4));
    const roomX = Math.floor(x + (width - roomWidth) / 2);
    const roomY = Math.floor(y + (height - roomHeight) / 2);
    
    return {
      id: `room-${Math.random().toString(36).substr(2, 9)}`,
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      centerX: Math.floor(roomX + roomWidth / 2),
      centerY: Math.floor(roomY + roomHeight / 2),
    };
  }

  return createNode(1, 1, params.mapWidth - 2, params.mapHeight - 2);
}

export function extractRooms(node: BSPNode): Room[] {
  const rooms: Room[] = [];
  
  function traverse(n: BSPNode) {
    if (n.isLeaf && n.room) {
      rooms.push(n.room);
    }
    if (n.left) traverse(n.left);
    if (n.right) traverse(n.right);
  }
  
  traverse(node);
  return rooms;
}

export function applyCellularAutomata(tiles: TileType[][], params: GenerationParameters): TileType[][] {
  const width = tiles[0].length;
  const height = tiles.length;
  
  for (let i = 0; i < params.mapHeight; i++) {
    for (let j = 0; j < params.mapWidth; j++) {
      tiles[i][j] = random() < 0.45 ? 'floor' : 'wall';
    }
  }
  
  for (let iteration = 0; iteration < params.caIterations; iteration++) {
    const newTiles = tiles.map(row => [...row]);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let wallCount = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (tiles[y + dy][x + dx] === 'wall') {
              wallCount++;
            }
          }
        }
        
        if (tiles[y][x] === 'wall') {
          if (wallCount >= params.caBirthLimit) {
            newTiles[y][x] = 'wall';
          } else {
            newTiles[y][x] = 'floor';
          }
        } else {
          if (wallCount <= params.caDeathLimit) {
            newTiles[y][x] = 'wall';
          } else {
            newTiles[y][x] = 'floor';
          }
        }
      }
    }
    
    tiles = newTiles;
  }
  
  return tiles;
}

interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: AStarNode;
}

export function findPath(start: Point, end: Point, tiles: TileType[][]): Point[] {
  const width = tiles[0].length;
  const height = tiles.length;
  
  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  
  const startNode: AStarNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: Math.abs(start.x - end.x) + Math.abs(start.y - end.y),
    f: Math.abs(start.x - end.x) + Math.abs(start.y - end.y),
  };
  
  openSet.push(startNode);
  
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];
  
  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    
    if (current.x === end.x && current.y === end.y) {
      const path: Point[] = [];
      let node: AStarNode | undefined = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }
    
    closedSet.add(`${current.x},${current.y}`);
    
    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (tiles[ny][nx] === 'wall') continue;
      if (closedSet.has(`${nx},${ny}`)) continue;
      
      const g = current.g + 1;
      const h = Math.abs(nx - end.x) + Math.abs(ny - end.y);
      const f = g + h;
      
      const existingNode = openSet.find(n => n.x === nx && n.y === ny);
      
      if (!existingNode) {
        openSet.push({ x: nx, y: ny, g, h, f, parent: current });
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.f = f;
        existingNode.parent = current;
      }
    }
  }
  
  return [];
}

export function connectRooms(rooms: Room[], tiles: TileType[][], corridorWidth: number): Corridor[] {
  const corridors: Corridor[] = [];
  
  for (let i = 0; i < rooms.length - 1; i++) {
    const room1 = rooms[i];
    const room2 = rooms[i + 1];
    
    const path = findPath(
      { x: room1.centerX, y: room1.centerY },
      { x: room2.centerX, y: room2.centerY },
      tiles
    );
    
    if (path.length > 0) {
      corridors.push({ points: path });
      
      for (const point of path) {
        for (let dy = -Math.floor(corridorWidth / 2); dy <= Math.floor(corridorWidth / 2); dy++) {
          for (let dx = -Math.floor(corridorWidth / 2); dx <= Math.floor(corridorWidth / 2); dx++) {
            const nx = point.x + dx;
            const ny = point.y + dy;
            if (ny >= 0 && ny < tiles.length && nx >= 0 && nx < tiles[0].length) {
              tiles[ny][nx] = 'corridor';
            }
          }
        }
      }
    }
  }
  
  return corridors;
}

export function checkConnectivity(tiles: TileType[][], rooms: Room[]): { connected: boolean; reachableTiles: Set<string> } {
  const width = tiles[0].length;
  const height = tiles.length;
  const reachableTiles = new Set<string>();
  
  if (rooms.length === 0) {
    return { connected: true, reachableTiles };
  }
  
  const startRoom = rooms[0];
  const startX = startRoom.centerX;
  const startY = startRoom.centerY;
  
  const queue: Point[] = [{ x: startX, y: startY }];
  reachableTiles.add(`${startX},${startY}`);
  
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (tiles[ny][nx] === 'wall') continue;
      if (reachableTiles.has(`${nx},${ny}`)) continue;
      
      reachableTiles.add(`${nx},${ny}`);
      queue.push({ x: nx, y: ny });
    }
  }
  
  let allRoomsConnected = true;
  for (const room of rooms) {
    if (!reachableTiles.has(`${room.centerX},${room.centerY}`)) {
      allRoomsConnected = false;
      break;
    }
  }
  
  return { connected: allRoomsConnected, reachableTiles };
}

export function placeMonsters(tiles: TileType[][], rooms: Room[], density: number): Monster[] {
  const monsters: Monster[] = [];
  const monsterTypes: ('goblin' | 'skeleton' | 'orc' | 'dragon')[] = ['goblin', 'skeleton', 'orc', 'dragon'];
  
  for (const room of rooms) {
    const floorTiles: Point[] = [];
    
    for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
      for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
        if (tiles[y][x] === 'floor') {
          floorTiles.push({ x, y });
        }
      }
    }
    
    const monsterCount = Math.floor(floorTiles.length * density / 100);
    
    for (let i = 0; i < monsterCount; i++) {
      if (floorTiles.length === 0) break;
      
      const index = Math.floor(random() * floorTiles.length);
      const pos = floorTiles.splice(index, 1)[0];
      
      monsters.push({
        id: `monster-${Math.random().toString(36).substr(2, 9)}`,
        x: pos.x,
        y: pos.y,
        type: monsterTypes[Math.floor(random() * monsterTypes.length)],
      });
    }
  }
  
  return monsters;
}

export function generateDungeon(params: GenerationParameters): DungeonMap {
  let tiles: TileType[][] = Array(params.mapHeight)
    .fill(null)
    .map(() => Array(params.mapWidth).fill('wall'));
  
  const bspTree = generateBSPTree(params);
  const rooms = extractRooms(bspTree);
  
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < params.mapHeight && x >= 0 && x < params.mapWidth) {
          tiles[y][x] = 'floor';
        }
      }
    }
  }
  
  tiles = applyCellularAutomata(tiles, params);
  
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < params.mapHeight && x >= 0 && x < params.mapWidth) {
          tiles[y][x] = 'floor';
        }
      }
    }
  }
  
  const corridors = connectRooms(rooms, tiles, params.corridorWidth);
  const monsters = placeMonsters(tiles, rooms, params.monsterDensity);
  
  return {
    width: params.mapWidth,
    height: params.mapHeight,
    tiles,
    rooms,
    corridors,
    monsters,
    seed: params.seed,
  };
}
