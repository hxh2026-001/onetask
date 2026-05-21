import { useDungeonStore } from '../store/dungeonStore';
import { RefreshCw, Save, Eye, EyeOff, Network } from 'lucide-react';

export function ParameterPanel() {
  const { parameters, setParameters, generateMap, saveCurrentMap, fogOfWar, toggleFogOfWar, showConnectivity, toggleConnectivity, animationState } = useDungeonStore();

  return (
    <div className="bg-dungeon-darker/80 backdrop-blur-sm rounded-xl p-6 border border-dungeon-blue/30 shadow-lg">
      <h2 className="text-xl font-bold text-dungeon-accent mb-6 flex items-center gap-2">
        <span>⚙️</span> 生成参数
      </h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-gray-300 text-sm">随机种子</label>
            <input
              type="number"
              value={parameters.seed}
              onChange={(e) => setParameters({ seed: parseInt(e.target.value) || 0 })}
              className="w-24 bg-dungeon-dark border border-dungeon-gray rounded px-2 py-1 text-white text-center text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-gray-300 text-sm">房间数量</label>
            <span className="text-dungeon-accent font-mono text-sm">{parameters.roomCount}</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={parameters.roomCount}
            onChange={(e) => setParameters({ roomCount: parseInt(e.target.value) })}
            className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-accent"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-gray-300 text-sm">走廊宽度</label>
            <span className="text-dungeon-accent font-mono text-sm">{parameters.corridorWidth}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={parameters.corridorWidth}
            onChange={(e) => setParameters({ corridorWidth: parseInt(e.target.value) })}
            className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-blue"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-gray-300 text-sm">怪物密度 (%)</label>
            <span className="text-dungeon-accent font-mono text-sm">{parameters.monsterDensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={parameters.monsterDensity}
            onChange={(e) => setParameters({ monsterDensity: parseInt(e.target.value) })}
            className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-red"
          />
        </div>

        <div className="border-t border-dungeon-gray/50 pt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">BSP 树参数</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-gray-300 text-sm">最小叶子尺寸</label>
              <span className="text-dungeon-accent font-mono text-sm">{parameters.bspMinLeafSize}</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              value={parameters.bspMinLeafSize}
              onChange={(e) => setParameters({ bspMinLeafSize: parseInt(e.target.value) })}
              className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-green"
            />
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-gray-300 text-sm">分割比例</label>
              <span className="text-dungeon-accent font-mono text-sm">{(parameters.bspSplitRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={parameters.bspSplitRatio * 100}
              onChange={(e) => setParameters({ bspSplitRatio: parseInt(e.target.value) / 100 })}
              className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-purple"
            />
          </div>
        </div>

        <div className="border-t border-dungeon-gray/50 pt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">元胞自动机参数</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-gray-300 text-sm">迭代次数</label>
              <span className="text-dungeon-accent font-mono text-sm">{parameters.caIterations}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={parameters.caIterations}
              onChange={(e) => setParameters({ caIterations: parseInt(e.target.value) })}
              className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-accent"
            />
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-gray-300 text-sm">出生阈值</label>
              <span className="text-dungeon-accent font-mono text-sm">{parameters.caBirthLimit}</span>
            </div>
            <input
              type="range"
              min="3"
              max="7"
              value={parameters.caBirthLimit}
              onChange={(e) => setParameters({ caBirthLimit: parseInt(e.target.value) })}
              className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-blue"
            />
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-gray-300 text-sm">死亡阈值</label>
              <span className="text-dungeon-accent font-mono text-sm">{parameters.caDeathLimit}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={parameters.caDeathLimit}
              onChange={(e) => setParameters({ caDeathLimit: parseInt(e.target.value) })}
              className="w-full h-2 bg-dungeon-gray rounded-lg appearance-none cursor-pointer accent-dungeon-red"
            />
          </div>
        </div>

        <div className="border-t border-dungeon-gray/50 pt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">地图尺寸</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-gray-300 text-sm block">宽度</label>
              <input
                type="number"
                min="20"
                max="100"
                value={parameters.mapWidth}
                onChange={(e) => setParameters({ mapWidth: parseInt(e.target.value) || 80 })}
                className="w-full bg-dungeon-dark border border-dungeon-gray rounded px-2 py-1 text-white text-center text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-gray-300 text-sm block">高度</label>
              <input
                type="number"
                min="20"
                max="80"
                value={parameters.mapHeight}
                onChange={(e) => setParameters({ mapHeight: parseInt(e.target.value) || 60 })}
                className="w-full bg-dungeon-dark border border-dungeon-gray rounded px-2 py-1 text-white text-center text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-dungeon-gray/50 pt-4 space-y-3">
          <button
            onClick={generateMap}
            disabled={animationState !== 'idle'}
            className="w-full py-3 bg-gradient-to-r from-dungeon-accent to-dungeon-purple text-dungeon-dark font-bold rounded-lg flex items-center justify-center gap-2 hover:from-yellow-400 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-dungeon-accent/30"
          >
            <RefreshCw className={`w-5 h-5 ${animationState !== 'idle' ? 'animate-spin' : ''}`} />
            {animationState !== 'idle' ? '生成中...' : '生成地牢'}
          </button>

          <button
            onClick={saveCurrentMap}
            className="w-full py-2 bg-dungeon-dark border border-dungeon-gray rounded-lg flex items-center justify-center gap-2 text-gray-300 hover:bg-dungeon-gray hover:text-white transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            保存地图
          </button>

          <div className="flex gap-2">
            <button
              onClick={toggleFogOfWar}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                fogOfWar
                  ? 'bg-dungeon-blue/20 border border-dungeon-blue text-dungeon-blue'
                  : 'bg-dungeon-dark border border-dungeon-gray text-gray-400'
              }`}
            >
              {fogOfWar ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              迷雾
            </button>

            <button
              onClick={toggleConnectivity}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                showConnectivity
                  ? 'bg-dungeon-green/20 border border-dungeon-green text-dungeon-green'
                  : 'bg-dungeon-dark border border-dungeon-gray text-gray-400'
              }`}
            >
              <Network className="w-4 h-4" />
              连通性
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
