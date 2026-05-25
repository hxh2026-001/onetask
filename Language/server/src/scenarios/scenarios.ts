export interface Scenario {
  id: string;
  name: string;
  description: string;
  code: string;
  expectedErrors: string[];
  highlights: string[];
}

export const SCENARIOS: Record<string, Scenario> = {
  normal: {
    id: 'normal',
    name: '正常编译场景',
    description: '展示完整的词法分析、语法分析、类型检查和代码生成过程',
    code: `// 正常编译示例
var x = 10;
var y = 20;
var result = x + y;

fn add(a, b) {
  return a + b;
}

var z = add(5, 15);

if (z > 10) {
  var msg = "Hello World";
  return msg;
}
`,
    expectedErrors: [],
    highlights: [
      '词法分析: 正确识别所有 Token',
      '语法分析: 构建完整 AST',
      '类型检查: 正确推断所有类型',
      '代码生成: 生成完整汇编代码',
    ],
  },

  lexerError: {
    id: 'lexerError',
    name: '词法错误场景',
    description: '展示词法分析器如何识别和报告非法字符',
    code: `// 词法错误示例
var x = @#$%^;  // 非法字符
var y = 123abc;  // 数字格式错误
var str = "unclosed string;
var ok = 100;
var bad = ;  // 空表达式
`,
    expectedErrors: [
      '非法字符',
      '数字格式错误',
      '字符串未闭合',
    ],
    highlights: [
      '词法分析: 检测非法字符 @#$%^',
      '词法分析: 检测数字格式错误 123abc',
      '词法分析: 检测未闭合字符串',
      '错误定位: 精确标注错误位置',
    ],
  },

  typeError: {
    id: 'typeError',
    name: '类型不匹配场景',
    description: '展示类型系统如何检测类型不匹配和隐式转换',
    code: `// 类型不匹配示例
var num = 42;
var str = "hello";
var bool = true;

var result1 = num + str;  // 隐式类型转换, 精度丢失
var result2 = num + bool; // 隐式类型转换: boolean->number

var x;  // 未初始化
var y = x + 10;  // 使用未初始化变量

if (num) {  // 隐式转换: number->boolean
  var inner = "shadowed";
}
var inner = "outer";
`,
    expectedErrors: [
      '类型不匹配',
      '隐式类型转换',
      '精度丢失',
    ],
    highlights: [
      '类型检查: 检测 num + str 隐式转换',
      '类型检查: 检测 num + bool 隐式转换',
      '类型推断: 波纹传播动画',
      '作用域遮蔽: inner 变量遮蔽检测',
    ],
  },

  infiniteRecursion: {
    id: 'infiniteRecursion',
    name: '无限递归栈溢出场景',
    description: '展示左递归文法如何导致解析器死循环',
    code: `// 左递归导致无限递归
expr := expr + term;

fn recurse(x) {
  recurse(x + 1);
}

a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t + u + v + w + x + y + z;

fn loop(x) {
  loop(x);
}
`,
    expectedErrors: [
      '左递归死循环',
      '递归深度超过限制',
      '栈溢出',
    ],
    highlights: [
      '递归下降: 检测左递归文法',
      '调用栈: 展示递归深度增长',
      '死循环检测: 自动终止并报告',
      '栈跟踪: 展示完整调用链',
    ],
  },
};

export function getScenario(id: string): Scenario | null {
  return SCENARIOS[id] || null;
}

export function getAllScenarios(): Scenario[] {
  return Object.values(SCENARIOS);
}
