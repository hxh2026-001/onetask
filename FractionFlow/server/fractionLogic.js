const gcd = (a, b, depth = 0) => {
  if (depth > 1000) {
    throw new Error('分数化简死循环：递归深度超限');
  }
  if (b === 0) {
    if (a === 0) {
      throw new Error('零作除数的非法运算：gcd(0, 0) 未定义');
    }
    return Math.abs(a);
  }
  return gcd(b, a % b, depth + 1);
};

const lcm = (a, b) => {
  if (a === 0 || b === 0) {
    throw new Error('通分错误：公倍数不能为零');
  }
  const product = Math.abs(a * b);
  if (product > Number.MAX_SAFE_INTEGER) {
    throw new Error('通分失败：数值溢出，超出安全整数范围');
  }
  return product / gcd(a, b);
};

const simplify = (num, den, allowInvalid = false) => {
  if (!allowInvalid && den === 0) {
    throw new Error('零作除数的非法运算');
  }
  if (den === 0) {
    return { numerator: num, denominator: 0, simplified: false, isNaN: true };
  }
  if (num === 0) {
    return { numerator: 0, denominator: 1, simplified: true, isNaN: false };
  }
  try {
    const g = gcd(Math.abs(num), Math.abs(den));
    const sign = (num * den) < 0 ? -1 : 1;
    return {
      numerator: sign * Math.abs(num / g),
      denominator: Math.abs(den / g),
      simplified: true,
      isNaN: false
    };
  } catch (e) {
    return {
      numerator: num,
      denominator: den,
      simplified: false,
      isNaN: false,
      error: e.message
    };
  }
};

const validateFraction = (num, den) => {
  const errors = [];
  if (!Number.isInteger(num) || !Number.isInteger(den)) {
    errors.push('分子和分母必须是整数');
  }
  if (den === 0) {
    errors.push('零作除数的非法运算');
  }
  if (Math.abs(num) > Number.MAX_SAFE_INTEGER || Math.abs(den) > Number.MAX_SAFE_INTEGER) {
    errors.push('数值溢出：超出安全整数范围');
  }
  return {
    valid: errors.length === 0,
    errors
  };
};

const addFractions = (num1, den1, num2, den2) => {
  const v1 = validateFraction(num1, den1);
  const v2 = validateFraction(num2, den2);
  
  if (!v1.valid || !v2.valid) {
    return {
      valid: false,
      errors: [...v1.errors, ...v2.errors],
      result: null,
      steps: []
    };
  }

  const steps = [];
  steps.push({
    type: 'input',
    description: '输入分数',
    data: { num1, den1, num2, den2 }
  });

  let commonDen, newNum1, newNum2, resultNum, resultDen;
  
  try {
    if (den1 === den2) {
      commonDen = den1;
      newNum1 = num1;
      newNum2 = num2;
      steps.push({
        type: 'same_denominator',
        description: '同分母，直接相加分子',
        data: { commonDen }
      });
    } else {
      steps.push({
        type: 'find_lcm',
        description: '寻找最小公倍数进行通分',
        data: { den1, den2 }
      });
      
      commonDen = lcm(den1, den2);
      newNum1 = num1 * (commonDen / den1);
      newNum2 = num2 * (commonDen / den2);
      
      steps.push({
        type: 'common_denominator',
        description: '通分完成',
        data: {
          commonDen,
          newNum1,
          newNum2,
          factor1: commonDen / den1,
          factor2: commonDen / den2
        }
      });
    }

    resultNum = newNum1 + newNum2;
    resultDen = commonDen;

    steps.push({
      type: 'add_numerators',
      description: '分子相加',
      data: { resultNum, resultDen }
    });

    const simplified = simplify(resultNum, resultDen);
    
    steps.push({
      type: 'simplify',
      description: simplified.simplified ? '约分完成' : '约分失败',
      data: simplified
    });

    return {
      valid: true,
      errors: [],
      result: simplified,
      steps,
      isImproper: Math.abs(simplified.numerator) >= Math.abs(simplified.denominator)
    };
  } catch (e) {
    steps.push({
      type: 'error',
      description: '运算错误',
      data: { error: e.message }
    });

    return {
      valid: false,
      errors: [e.message],
      result: null,
      steps
    };
  }
};

const subtractFractions = (num1, den1, num2, den2) => {
  return addFractions(num1, den1, -num2, den2);
};

const multiplyFractions = (num1, den1, num2, den2) => {
  const v1 = validateFraction(num1, den1);
  const v2 = validateFraction(num2, den2);
  
  if (!v1.valid || !v2.valid) {
    return {
      valid: false,
      errors: [...v1.errors, ...v2.errors],
      result: null,
      steps: []
    };
  }

  const steps = [];
  steps.push({
    type: 'input',
    description: '输入分数',
    data: { num1, den1, num2, den2 }
  });

  const resultNum = num1 * num2;
  const resultDen = den1 * den2;

  steps.push({
    type: 'multiply',
    description: '分子乘分子，分母乘分母',
    data: { resultNum, resultDen }
  });

  if (Math.abs(resultNum) > Number.MAX_SAFE_INTEGER || Math.abs(resultDen) > Number.MAX_SAFE_INTEGER) {
    return {
      valid: false,
      errors: ['乘法溢出：结果超出安全整数范围'],
      result: null,
      steps: [...steps, { type: 'overflow', description: '数值溢出', data: { resultNum, resultDen } }]
    };
  }

  const simplified = simplify(resultNum, resultDen);
  
  steps.push({
    type: 'simplify',
    description: simplified.simplified ? '约分完成' : '约分失败',
    data: simplified
  });

  return {
    valid: true,
    errors: [],
    result: simplified,
    steps,
    isImproper: Math.abs(simplified.numerator) >= Math.abs(simplified.denominator)
  };
};

const divideFractions = (num1, den1, num2, den2) => {
  if (num2 === 0) {
    return {
      valid: false,
      errors: ['零作除数的非法运算：除以零分数'],
      result: { numerator: NaN, denominator: NaN, isNaN: true },
      steps: [{
        type: 'error',
        description: '零作除数的非法运算',
        data: { num2, den2 }
      }]
    };
  }
  
  return multiplyFractions(num1, den1, den2, num2);
};

const calculate = (num1, den1, operator, num2, den2) => {
  switch (operator) {
    case '+':
      return addFractions(num1, den1, num2, den2);
    case '-':
      return subtractFractions(num1, den1, num2, den2);
    case '×':
    case '*':
      return multiplyFractions(num1, den1, num2, den2);
    case '÷':
    case '/':
      return divideFractions(num1, den1, num2, den2);
    default:
      return {
        valid: false,
        errors: [`不支持的运算符: ${operator}`],
        result: null,
        steps: []
      };
  }
};

module.exports = {
  gcd,
  lcm,
  simplify,
  validateFraction,
  addFractions,
  subtractFractions,
  multiplyFractions,
  divideFractions,
  calculate
};
