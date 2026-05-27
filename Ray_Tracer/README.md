# 实时光线追踪渲染器

使用 Express + SolidJS + 本地 JSON 文件开发的实时光线追踪渲染器。

## 功能特性

- 场景管理与本地 JSON 存储
- BVH 加速结构
- 材质系统（漫反射、金属、玻璃）
- 多种几何体（球体、平面、立方体）
- 四个预设场景按钮：
  1. 预设一：反射无限递归
  2. 预设二：折射全内反射
  3. 预设三：软阴影噪点
  4. 预设四：BVH 树失衡

## 快速开始

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动服务

```bash
# 启动后端（端口 3018）
cd backend
npm start

# 在另一个终端启动前端
cd frontend
npm run dev
```

或者使用 concurrently 同时启动前后端：

```bash
# 在根目录
npm run dev
```

## 项目结构

```
.
├── backend/          # Express 后端
│   ├── index.js   # 服务器入口
│   ├── package.json
│   └── scenes/    # 场景存储目录
├── frontend/       # SolidJS 前端
│   ├── src/
│   │   ├── core/        # 核心渲染模块
│   │   │   ├── renderer.js
│   │   │   ├── bvh.js
│   │   │   ├── hit.js
│   │   │   ├── material.js
│   │   │   └── ray.js
│   │   ├── objects/     # 几何体
│   │   │   ├── sphere.js
│   │   │   ├── plane.js
│   │   │   └── cube.js
│   │   ├── utils/
│   │   │   └── vec3.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json
```
