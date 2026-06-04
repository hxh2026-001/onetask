const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const cors = require('koa-cors');
const path = require('path');
const fs = require('fs');

const { initDatabase, createSession, saveOperation, getHistory } = require('./db');
const { calculate, simplify, validateFraction } = require('./fractionLogic');

const app = new Koa();
const router = new Router();

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(koaBody({
  jsonLimit: '10mb',
  multipart: true
}));

app.use(async (ctx, next) => {
  ctx.set('X-Powered-By', 'FractionFlow/1.0');
  ctx.set('Cache-Control', 'no-store');
  await next();
});

router.get('/api/health', async (ctx) => {
  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: 3001,
    message: '分数运算教学系统后端服务运行正常'
  };
});

router.post('/api/session', async (ctx) => {
  const { sessionId, studentName } = ctx.request.body;
  
  if (!sessionId) {
    ctx.status = 400;
    ctx.body = { error: 'sessionId 是必需的' };
    return;
  }
  
  createSession(sessionId, studentName);
  
  ctx.body = {
    success: true,
    sessionId,
    message: '会话创建成功'
  };
});

router.post('/api/calculate', async (ctx) => {
  const { 
    numerator1, denominator1, operator, numerator2, denominator2,
    sessionId, shapeType, snapshot 
  } = ctx.request.body;

  const num1 = parseInt(numerator1, 10);
  const den1 = parseInt(denominator1, 10);
  const num2 = parseInt(numerator2, 10);
  const den2 = parseInt(denominator2, 10);

  const validation = validateFraction(num1, den1);
  if (!validation.valid && !(den1 === 0 || den2 === 0)) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      errors: validation.errors,
      result: null
    };
    return;
  }

  const result = calculate(num1, den1, operator, num2, den2);

  if (sessionId) {
    saveOperation({
      sessionId,
      operationType: result.valid ? 'calculation' : 'error_calculation',
      numerator1: num1,
      denominator1: den1,
      numerator2: num2,
      denominator2: den2,
      operator,
      resultNum: result.result ? result.result.numerator : null,
      resultDen: result.result ? result.result.denominator : null,
      isValid: result.valid,
      errorMessage: result.errors.join('; ') || null,
      snapshot: snapshot || null,
      shapeType: shapeType || 'circle'
    });
  }

  ctx.body = {
    success: result.valid,
    ...result
  };
});

router.post('/api/simplify', async (ctx) => {
  const { numerator, denominator, sessionId, snapshot } = ctx.request.body;
  
  const num = parseInt(numerator, 10);
  const den = parseInt(denominator, 10);

  try {
    const result = simplify(num, den, true);
    
    if (sessionId) {
      saveOperation({
        sessionId,
        operationType: 'simplify',
        numerator1: num,
        denominator1: den,
        numerator2: null,
        denominator2: null,
        operator: null,
        resultNum: result.numerator,
        resultDen: result.denominator,
        isValid: !result.isNaN && result.simplified,
        errorMessage: result.error || (result.isNaN ? '零作除数' : null),
        snapshot: snapshot || null
      });
    }

    ctx.body = {
      success: !result.isNaN && result.simplified,
      result,
      isImproper: Math.abs(result.numerator) >= Math.abs(result.denominator)
    };
  } catch (e) {
    ctx.body = {
      success: false,
      result: null,
      errors: [e.message]
    };
  }
});

router.get('/api/history/:sessionId', async (ctx) => {
  const { sessionId } = ctx.params;
  const { limit } = ctx.query;
  
  const history = getHistory(sessionId, parseInt(limit, 10) || 50);
  
  ctx.body = {
    success: true,
    count: history.length,
    history
  };
});

router.post('/api/operation', async (ctx) => {
  const data = ctx.request.body;
  
  if (!data.sessionId || !data.operationType) {
    ctx.status = 400;
    ctx.body = { error: 'sessionId 和 operationType 是必需的' };
    return;
  }

  const result = saveOperation(data);
  
  ctx.body = {
    success: true,
    id: result.lastInsertRowid
  };
});

router.get('/api/presets', async (ctx) => {
  const presets = [
    {
      id: 'preset1',
      name: '预设一：同分母加法',
      description: '学习同分母分数的加法运算',
      difficulty: '简单',
      data: {
        numerator1: 1, denominator1: 4,
        numerator2: 2, denominator2: 4,
        operator: '+',
        shapeType: 'circle',
        expectedResult: { numerator: 3, denominator: 4 },
        hint: '同分母相加，只需要将分子相加，分母保持不变'
      }
    },
    {
      id: 'preset2',
      name: '预设二：异分母通分陷阱',
      description: '学习异分母分数的通分，观察通分失败时的数值溢出',
      difficulty: '中等',
      data: {
        numerator1: 1, denominator1: 3,
        numerator2: 1, denominator2: 7,
        operator: '+',
        shapeType: 'rect',
        trapMode: 'overflow_test',
        trapValues: [
          { den1: 999999937, den2: 999999929, message: '测试通分溢出：大质数相乘导致溢出' }
        ],
        hint: '异分母相加，需要先通分找到最小公倍数。注意：当分母过大时可能导致数值溢出！'
      }
    },
    {
      id: 'preset3',
      name: '预设三：分子大于分母的假分数',
      description: '学习假分数的概念和化简',
      difficulty: '中等',
      data: {
        numerator1: 7, denominator1: 4,
        numerator2: 5, denominator2: 4,
        operator: '+',
        shapeType: 'circle',
        expectedResult: { numerator: 12, denominator: 4, simplified: { numerator: 3, denominator: 1 } },
        hint: '当分子大于或等于分母时，这是一个假分数，可以化简为带分数或整数'
      }
    },
    {
      id: 'preset4',
      name: '预设四：零作除数的非法运算',
      description: '理解为什么零不能作为分母，观察 NaN 渲染',
      difficulty: '困难',
      data: {
        numerator1: 5, denominator1: 0,
        numerator2: 3, denominator2: 0,
        operator: '+',
        shapeType: 'circle',
        trapMode: 'zero_division',
        expectedError: '零作除数的非法运算',
        hint: '注意：当分母为零时，分数是没有意义的。系统会显示 NaN，UI 可能出现异常！',
        testDivision: { num: 5, den: 0, operator: '÷', num2: 0, den2: 1 }
      }
    }
  ];
  
  ctx.body = {
    success: true,
    count: presets.length,
    presets
  };
});

router.post('/api/validate-drag', async (ctx) => {
  const { numerator, denominator, shapeType, sliceCount, sessionId } = ctx.request.body;
  
  const num = parseInt(numerator, 10);
  const den = parseInt(denominator, 10);
  const slices = parseInt(sliceCount, 10);

  const validation = validateFraction(num, den);
  
  const issues = [];
  if (slices !== den && den > 0) {
    issues.push(`切片数量 (${slices}) 与分母 (${den}) 不匹配`);
  }
  if (num > den && den > 0) {
    issues.push('分子大于分母，这是一个假分数');
  }
  if (num < 0) {
    issues.push('分子为负数');
  }

  if (sessionId) {
    saveOperation({
      sessionId,
      operationType: 'drag_validation',
      numerator1: num,
      denominator1: den,
      shapeType: shapeType || 'circle',
      isValid: validation.valid && issues.length === 0,
      errorMessage: [...validation.errors, ...issues].join('; ') || null,
      snapshot: { sliceCount, shapeType }
    });
  }

  ctx.body = {
    valid: validation.valid && issues.length === 0,
    errors: [...validation.errors, ...issues],
    isImproper: den > 0 && num > den,
    isZeroDenominator: den === 0,
    isNegative: num < 0
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = {
    error: '接口不存在',
    path: ctx.path,
    method: ctx.method
  };
});

const startServer = async () => {
  try {
    console.log('🔄 正在初始化 SQLite 数据库...');
    await initDatabase();
    console.log('✅ 数据库初始化完成');
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`\n🚀 FractionFlow 后端服务已启动`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`📚 预设场景: http://localhost:${PORT}/api/presets`);
      console.log(`💾 SQLite 数据库已就绪\n`);
    });
  } catch (e) {
    console.error('❌ 服务器启动失败:', e.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
