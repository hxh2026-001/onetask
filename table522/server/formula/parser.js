// 公式解析器 - 词法分析 + 语法分析
// 支持: 数字、字符串、单元格 A1、范围 A1:B3、跨表 Sheet1!A1、函数 SUM(A1:A3)、数组 {1,2;3,4}、二元运算符、比较、& 连接

export const TOKENS = {
  NUMBER: 'NUMBER', STRING: 'STRING', IDENT: 'IDENT',
  LPAREN: 'LPAREN', RPAREN: 'RPAREN', COMMA: 'COMMA',
  COLON: 'COLON', SEMICOLON: 'SEMICOLON', BANG: 'BANG',
  PLUS: 'PLUS', MINUS: 'MINUS', STAR: 'STAR', SLASH: 'SLASH',
  PERCENT: 'PERCENT', CARET: 'CARET', AMP: 'AMP',
  EQ: 'EQ', LT: 'LT', GT: 'GT', LTE: 'LTE', GTE: 'GTE', NE: 'NE',
  LBRACE: 'LBRACE', RBRACE: 'RBRACE', EOF: 'EOF'
};

function isAlpha(c) { return /[a-zA-Z_]/.test(c); }
function isDigit(c) { return /[0-9]/.test(c); }
function isAlnum(c) { return isAlpha(c) || isDigit(c); }

export function tokenize(input) {
  const tokens = [];
  let i = 0;
  const src = input.replace(/\s+/g, '');
  while (i < src.length) {
    const c = src[i];
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let j = i, hasDot = false;
      while (j < src.length && (isDigit(src[j]) || (src[j] === '.' && !hasDot))) {
        if (src[j] === '.') hasDot = true;
        j++;
      }
      tokens.push({ type: TOKENS.NUMBER, value: parseFloat(src.slice(i, j)), pos: i });
      i = j;
    } else if (c === '"') {
      let j = i + 1, val = '';
      while (j < src.length && src[j] !== '"') { val += src[j]; j++; }
      tokens.push({ type: TOKENS.STRING, value: val, pos: i });
      i = j + 1;
    } else if (isAlpha(c)) {
      let j = i;
      while (j < src.length && isAlnum(src[j])) j++;
      const word = src.slice(i, j);
      if (/^[A-Za-z]+[0-9]+$/.test(word)) {
        tokens.push({ type: TOKENS.IDENT, value: word, cellRef: true, pos: i });
      } else {
        tokens.push({ type: TOKENS.IDENT, value: word, pos: i });
      }
      i = j;
    } else if (c === '!' && tokens.length && tokens[tokens.length - 1].type === TOKENS.IDENT) {
      tokens.push({ type: TOKENS.BANG, value: '!', pos: i });
      i++;
    } else {
      const two = src.slice(i, i + 2);
      if (two === '<=') { tokens.push({ type: TOKENS.LTE, value: '<=', pos: i }); i += 2; }
      else if (two === '>=') { tokens.push({ type: TOKENS.GTE, value: '>=', pos: i }); i += 2; }
      else if (two === '<>') { tokens.push({ type: TOKENS.NE, value: '<>', pos: i }); i += 2; }
      else if (c === '(') { tokens.push({ type: TOKENS.LPAREN, value: '(', pos: i }); i++; }
      else if (c === ')') { tokens.push({ type: TOKENS.RPAREN, value: ')', pos: i }); i++; }
      else if (c === ',') { tokens.push({ type: TOKENS.COMMA, value: ',', pos: i }); i++; }
      else if (c === ':') { tokens.push({ type: TOKENS.COLON, value: ':', pos: i }); i++; }
      else if (c === ';') { tokens.push({ type: TOKENS.SEMICOLON, value: ';', pos: i }); i++; }
      else if (c === '+') { tokens.push({ type: TOKENS.PLUS, value: '+', pos: i }); i++; }
      else if (c === '-') { tokens.push({ type: TOKENS.MINUS, value: '-', pos: i }); i++; }
      else if (c === '*') { tokens.push({ type: TOKENS.STAR, value: '*', pos: i }); i++; }
      else if (c === '/') { tokens.push({ type: TOKENS.SLASH, value: '/', pos: i }); i++; }
      else if (c === '%') { tokens.push({ type: TOKENS.PERCENT, value: '%', pos: i }); i++; }
      else if (c === '^') { tokens.push({ type: TOKENS.CARET, value: '^', pos: i }); i++; }
      else if (c === '&') { tokens.push({ type: TOKENS.AMP, value: '&', pos: i }); i++; }
      else if (c === '=') { tokens.push({ type: TOKENS.EQ, value: '=', pos: i }); i++; }
      else if (c === '<') { tokens.push({ type: TOKENS.LT, value: '<', pos: i }); i++; }
      else if (c === '>') { tokens.push({ type: TOKENS.GT, value: '>', pos: i }); i++; }
      else if (c === '{') { tokens.push({ type: TOKENS.LBRACE, value: '{', pos: i }); i++; }
      else if (c === '}') { tokens.push({ type: TOKENS.RBRACE, value: '}', pos: i }); i++; }
      else { throw new Error(`未知字符: ${c} @${i}`); }
    }
  }
  tokens.push({ type: TOKENS.EOF, value: '', pos: i });
  return tokens;
}

// AST 节点类型
export const N = {
  NUMBER: 'Num', STRING: 'Str', CELL: 'Cell', RANGE: 'Range',
  BINOP: 'BinOp', UNARY: 'Unary', FUNC: 'Func', ARRAY: 'Array', COMPARE: 'Cmp'
};

class Parser {
  constructor(tokens) { this.tokens = tokens; this.pos = 0; }
  peek() { return this.tokens[this.pos]; }
  consume(type) {
    const t = this.tokens[this.pos];
    if (t.type !== type) throw new Error(`期望 ${type} 但得到 ${t.type}`);
    this.pos++;
    return t;
  }

  parse() { return this.parseExpr(); }

  parseExpr() {
    let left = this.parseConcat();
    while (this.peek().type === TOKENS.AMP) {
      this.consume(TOKENS.AMP);
      const right = this.parseConcat();
      left = { type: N.BINOP, op: '&', left, right };
    }
    return left;
  }

  parseConcat() {
    let left = this.parseCmp();
    return left;
  }

  parseCmp() {
    let left = this.parseAdd();
    const t = this.peek();
    if ([TOKENS.EQ, TOKENS.LT, TOKENS.GT, TOKENS.LTE, TOKENS.GTE, TOKENS.NE].includes(t.type)) {
      this.pos++;
      const right = this.parseAdd();
      return { type: N.COMPARE, op: t.value, left, right };
    }
    return left;
  }

  parseAdd() {
    let left = this.parseMul();
    while ([TOKENS.PLUS, TOKENS.MINUS].includes(this.peek().type)) {
      const op = this.peek().type === TOKENS.PLUS ? '+' : '-';
      this.pos++;
      const right = this.parseMul();
      left = { type: N.BINOP, op, left, right };
    }
    return left;
  }

  parseMul() {
    let left = this.parsePow();
    while ([TOKENS.STAR, TOKENS.SLASH].includes(this.peek().type)) {
      const op = this.peek().type === TOKENS.STAR ? '*' : '/';
      this.pos++;
      const right = this.parsePow();
      left = { type: N.BINOP, op, left, right };
    }
    return left;
  }

  parsePow() {
    let left = this.parseUnary();
    while (this.peek().type === TOKENS.CARET) {
      this.consume(TOKENS.CARET);
      const right = this.parseUnary();
      left = { type: N.BINOP, op: '^', left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.peek().type === TOKENS.PLUS) { this.pos++; return this.parseUnary(); }
    if (this.peek().type === TOKENS.MINUS) {
      this.pos++;
      const operand = this.parseUnary();
      return { type: N.UNARY, op: '-', operand };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let node = this.parsePrimary();
    if (this.peek().type === TOKENS.PERCENT) {
      this.consume(TOKENS.PERCENT);
      node = { type: N.BINOP, op: '/', left: node, right: { type: N.NUMBER, value: 100 } };
    }
    return node;
  }

  parsePrimary() {
    const t = this.peek();
    if (t.type === TOKENS.NUMBER) { this.pos++; return { type: N.NUMBER, value: t.value }; }
    if (t.type === TOKENS.STRING) { this.pos++; return { type: N.STRING, value: t.value }; }
    if (t.type === TOKENS.LPAREN) {
      this.consume(TOKENS.LPAREN);
      const e = this.parseExpr();
      this.consume(TOKENS.RPAREN);
      return e;
    }
    if (t.type === TOKENS.LBRACE) {
      return this.parseArray();
    }
    if (t.type === TOKENS.IDENT) {
      // 函数或单元格引用或跨表
      this.pos++;
      if (this.peek().type === TOKENS.LPAREN) {
        this.consume(TOKENS.LPAREN);
        const args = [];
        if (this.peek().type !== TOKENS.RPAREN) {
          args.push(this.parseExpr());
          while (this.peek().type === TOKENS.COMMA) {
            this.consume(TOKENS.COMMA);
            args.push(this.parseExpr());
          }
        }
        this.consume(TOKENS.RPAREN);
        return { type: N.FUNC, name: t.value.toUpperCase(), args };
      }
      // 单元格引用或跨表
      let sheet = null;
      let cellName = t.value;
      if (this.peek().type === TOKENS.BANG) {
        this.consume(TOKENS.BANG);
        sheet = cellName;
        const next = this.consume(TOKENS.IDENT);
        cellName = next.value;
      }
      // 范围?
      if (this.peek().type === TOKENS.COLON) {
        this.consume(TOKENS.COLON);
        const next = this.consume(TOKENS.IDENT);
        return { type: N.RANGE, start: cellName, end: next.value, sheet };
      }
      return { type: N.CELL, name: cellName, sheet };
    }
    throw new Error(`意外的 token: ${t.type} ${t.value}`);
  }

  parseArray() {
    this.consume(TOKENS.LBRACE);
    const rows = [];
    let row = [];
    row.push(this.parseExpr());
    while (this.peek().type === TOKENS.COMMA || this.peek().type === TOKENS.SEMICOLON) {
      if (this.peek().type === TOKENS.COMMA) {
        this.pos++;
        row.push(this.parseExpr());
      } else {
        this.pos++;
        rows.push(row);
        row = [];
        row.push(this.parseExpr());
      }
    }
    rows.push(row);
    this.consume(TOKENS.RBRACE);
    return { type: N.ARRAY, rows };
  }
}

export function parseFormula(input) {
  const clean = input.startsWith('=') ? input.slice(1) : input;
  const tokens = tokenize(clean);
  const p = new Parser(tokens);
  return p.parse();
}

// 收集单元格引用
export function collectRefs(ast, currentSheet) {
  const refs = new Set();
  function walk(node) {
    if (!node) return;
    if (node.type === N.CELL) {
      const sheet = node.sheet || currentSheet;
      refs.add(`${sheet}!${node.name}`);
    } else if (node.type === N.RANGE) {
      const sheet = node.sheet || currentSheet;
      const cells = expandRange(node.start, node.end);
      cells.forEach(c => refs.add(`${sheet}!${c}`));
    } else {
      Object.values(node).forEach(v => {
        if (Array.isArray(v)) v.forEach(walk);
        else if (typeof v === 'object' && v && v.type) walk(v);
      });
    }
  }
  walk(ast);
  return refs;
}

export function cellNameToRC(name) {
  const m = /^([A-Za-z]+)(\d+)$/.exec(name);
  if (!m) throw new Error(`无效单元格: ${name}`);
  let col = 0;
  for (const c of m[1].toUpperCase()) col = col * 26 + (c.charCodeAt(0) - 64);
  return { row: parseInt(m[2], 10) - 1, col: col - 1 };
}

export function rcToCellName(row, col) {
  let s = '';
  col++;
  while (col > 0) {
    const r = (col - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    col = Math.floor((col - 1) / 26);
  }
  return s + (row + 1);
}

export function expandRange(start, end) {
  const s = cellNameToRC(start), e = cellNameToRC(end);
  const r1 = Math.min(s.row, e.row), r2 = Math.max(s.row, e.row);
  const c1 = Math.min(s.col, e.col), c2 = Math.max(s.col, e.col);
  const cells = [];
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++)
      cells.push(rcToCellName(r, c));
  return cells;
}
