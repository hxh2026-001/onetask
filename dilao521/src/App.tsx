import { useEffect } from 'react';
import { useDungeonStore } from './store/dungeonStore';
import { DungeonCanvas } from './components/DungeonCanvas';
import { ParameterPanel } from './components/ParameterPanel';
import { PresetButtons } from './components/PresetButtons';
import { StatsPanel } from './components/StatsPanel';

function App() {
  const { initialize } = useDungeonStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dungeon-dark via-dungeon-darker to-dungeon-dark">
      <header className="border-b border-dungeon-blue/30 bg-dungeon-darker/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏰</span>
              <div>
                <h1 className="text-xl font-bold text-dungeon-accent">程序化地牢生成系统</h1>
                <p className="text-gray-400 text-sm">BSP 树分割 + 元胞自动机</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-dungeon-green rounded-full animate-pulse" />
                系统就绪
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <PresetButtons />
            <StatsPanel />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-dungeon-darker/80 backdrop-blur-sm rounded-xl p-4 border border-dungeon-blue/30 shadow-lg">
              <DungeonCanvas />
            </div>
          </div>

          <div className="lg:col-span-1">
            <ParameterPanel />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-dungeon-darker/50 rounded-lg p-4 border border-dungeon-gray/30">
            <h3 className="text-dungeon-accent font-semibold mb-2">🌲 BSP 树分割</h3>
            <p className="text-gray-400 text-sm">递归分割空间生成房间布局，可通过调整分割比例观察极端纵横比下的畸形房间</p>
          </div>
          <div className="bg-dungeon-darker/50 rounded-lg p-4 border border-dungeon-gray/30">
            <h3 className="text-dungeon-blue font-semibold mb-2">🧬 元胞自动机</h3>
            <p className="text-gray-400 text-sm">基于邻居计数规则雕刻洞穴，迭代次数不足会产生不可达死胡同</p>
          </div>
          <div className="bg-dungeon-darker/50 rounded-lg p-4 border border-dungeon-gray/30">
            <h3 className="text-dungeon-green font-semibold mb-2">🧵 A* 走廊连接</h3>
            <p className="text-gray-400 text-sm">使用 A* 算法连接房间中心，忽略对角穿越会产生冗长路径</p>
          </div>
          <div className="bg-dungeon-darker/50 rounded-lg p-4 border border-dungeon-gray/30">
            <h3 className="text-dungeon-red font-semibold mb-2">🔗 连通性验证</h3>
            <p className="text-gray-400 text-sm">洪水填充算法验证所有房间可达性，显示孤立区域</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-dungeon-blue/30 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>程序化地牢生成系统 - BSP 树 + 元胞自动机算法演示</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
