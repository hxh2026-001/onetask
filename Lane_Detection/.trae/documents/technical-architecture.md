## 1. 架构设计

```mermaid
graph TB
    subgraph Frontend["前端 Svelte + Vite"]
        A["绘图画布 Canvas"]
        B["可视化层叠 Canvas x4"]
        C["粒子动画 Canvas"]
        D["参数控制面板"]
        E["数据面板"]
        F["预设按钮栏"]
    end
    subgraph Backend["后端 Express"]
        G["图像处理 API"]
        H["霍夫变换引擎"]
        I["RANSAC引擎"]
        J["SQLite存储层"]
    end
    A -->|图像数据 POST| G
    F -->|预设场景| G
    G --> H
    H --> I
    I --> J
    G -->|边缘图+累加器+线段| B
    G -->|投票矩阵| C
    G -->|检测结果| E
    D -->|参数调节| G
```

## 2. 技术说明

- 前端：Svelte 5 + Vite + TailwindCSS 4
- 初始化工具：Vite（svelte-ts 模板）
- 后端：Express 5 + TypeScript（ESM格式）
- 数据库：SQLite3（better-sqlite3 同步驱动）
- 端口：前端开发服务器 5173，后端 API 3010，Vite 代理到 3010

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含绘图、可视化、参数控制全部功能 |

## 4. API 定义

### 4.1 图像检测 API

```typescript
POST /api/detect
Request: {
  imageData: string       // base64 编码的 PNG 图像
  params: {
    cannyLow: number      // Canny 低阈值 (默认 50)
    cannyHigh: number     // Canny 高阈值 (默认 150)
    houghThreshold: number // 霍夫投票阈值 (默认 80)
    ransacIter: number    // RANSAC 迭代次数 (默认 100)
    ransacDist: number    // RANSAC 距离阈值 (默认 5)
    nmsWindow: number     // NMS 窗口大小 (默认 5)
  }
}
Response: {
  edges: number[]           // 边缘图 (0/1 扁平数组, width*height)
  accumulator: number[]     // 累加器矩阵 (rhoBins * thetaBins)
  rhoBins: number           // ρ 方向分箱数
  thetaBins: number         // θ 方向分箱数
  lines: Array<{
    rho: number             // 极坐标距离
    theta: number           // 极坐标角度(弧度)
    startX: number          // 线段起点X
    startY: number          // 线段起点Y
    endX: number            // 线段终点X
    endY: number            // 线段终点Y
    votes: number           // 得票数
    isFalsePositive: boolean // 是否误检
    falseReason?: string    // 误检原因
  }>
  imageWidth: number
  imageHeight: number
}
```

### 4.2 预设场景 API

```typescript
GET /api/presets/:name
Response: {
  imageData: string   // base64 预设图像
  description: string // 场景描述
}
```
预设名称: shadow-crack, road-crack, sharp-curve, multi-lane

### 4.3 历史记录 API

```typescript
GET /api/history
Response: Array<{
  id: number
  timestamp: string
  lines: Array<{ rho: number; theta: number; votes: number }>
  accumulatorSize: string
}>
```

## 5. 服务端架构图

```mermaid
graph LR
    A["Controller: detectRouter"] --> B["Service: HoughService"]
    B --> C["Processor: ImageProcessor"]
    C --> D["灰度化+高斯模糊"]
    C --> E["Sobel梯度+NMS"]
    C --> F["Canny边缘检测"]
    B --> G["HoughTransform"]
    B --> H["RANSACFitter"]
    B --> I["Repository: DetectionRepo"]
    I --> J["SQLite: detections.db"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    DETECTION {
        int id PK
        text timestamp
        int image_width
        int image_height
        text params_json
    }
    LINE_SEGMENT {
        int id PK
        int detection_id FK
        real rho
        real theta
        int votes
        int start_x
        int start_y
        int end_x
        int end_y
        int is_false_positive
        text false_reason
    }
    ACCUMULATOR_SNAPSHOT {
        int id PK
        int detection_id FK
        int rho_bins
        int theta_bins
        blob matrix_data
    }
    DETECTION ||--o{ LINE_SEGMENT : contains
    DETECTION ||--o| ACCUMULATOR_SNAPSHOT : has
```

### 6.2 数据定义语言

```sql
CREATE TABLE IF NOT EXISTS detection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    image_width INTEGER NOT NULL,
    image_height INTEGER NOT NULL,
    params_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS line_segment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detection_id INTEGER NOT NULL REFERENCES detection(id),
    rho REAL NOT NULL,
    theta REAL NOT NULL,
    votes INTEGER NOT NULL,
    start_x INTEGER NOT NULL,
    start_y INTEGER NOT NULL,
    end_x INTEGER NOT NULL,
    end_y INTEGER NOT NULL,
    is_false_positive INTEGER NOT NULL DEFAULT 0,
    false_reason TEXT
);

CREATE TABLE IF NOT EXISTS accumulator_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detection_id INTEGER NOT NULL REFERENCES detection(id),
    rho_bins INTEGER NOT NULL,
    theta_bins INTEGER NOT NULL,
    matrix_data BLOB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_line_segment_detection ON line_segment(detection_id);
CREATE INDEX IF NOT EXISTS idx_accumulator_detection ON accumulator_snapshot(detection_id);
```
