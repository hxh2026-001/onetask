const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const path = require('path');
const fs = require('fs');

const { initDB } = require('./db');
const router = require('./routes');

const PORT = 3008;

async function startServer() {
  await initDB();
  console.log('📦 数据库初始化完成');
  
  const app = new Koa();
  
  app.use(cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(bodyParser({
    jsonLimit: '10mb',
    formLimit: '10mb'
  }));
  
  app.use(async (ctx, next) => {
    console.log(`[${new Date().toISOString()}] ${ctx.method} ${ctx.url}`);
    await next();
  });
  
  app.use(router.routes());
  app.use(router.allowedMethods());
  
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    const serve = require('koa-static');
    app.use(serve(clientDist));
    
    app.use(async (ctx, next) => {
      if (ctx.method === 'GET' && !ctx.path.startsWith('/api')) {
        ctx.body = fs.createReadStream(path.join(clientDist, 'index.html'));
        ctx.type = 'text/html';
      } else {
        await next();
      }
    });
  }
  
  app.listen(PORT, () => {
    console.log(`
🚀 几何约束求解系统已启动
📍 后端 API: http://localhost:${PORT}/api
🗄️  数据库: ${path.join(__dirname, 'constraint_solver.db')}

可用预设场景:
  • 预设一: 过约束系统 (5个约束, 4个自由度)
  • 预设二: 欠约束系统 (缺少2个距离约束)
  • 预设三: 矛盾约束 (线段既等于3又等于5)
  • 预设四: 循环依赖约束 (三圆两两相切)
  • 预设五: 局部最优解
  • 预设六: 数值奇异

可观察现象:
  ✅ 过约束系统无解时最小二乘解偏离期望值
  🔄 循环依赖导致迭代不收敛 (残差震荡)
  ⛔ 初始猜测不佳导致陷入局部最优解
  ⚠️  数值奇异导致雅可比矩阵不可逆
`);
  });
}

startServer().catch(err => {
  console.error('❌ 服务器启动失败:', err);
  process.exit(1);
});
