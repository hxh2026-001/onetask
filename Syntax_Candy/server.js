const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3008;

app.use(express.json());
app.use(express.static('public'));

const tokenRules = [
  { type: 'WHITESPACE', pattern: '\\s+' },
  { type: 'COMMENT', pattern: '//.*' },
  { type: 'KEYWORD', pattern: '\\b(var|let|const|if|else|while|for|function|return|true|false|null|undefined)\\b' },
  { type: 'TYPE', pattern: '\\b(number|string|boolean|any)\\b' },
  { type: 'IDENTIFIER', pattern: '[a-zA-Z_][a-zA-Z0-9_]*' },
  { type: 'NUMBER', pattern: '\\d+' },
  { type: 'STRING', pattern: '"[^"]*"|\'[^\']*\'' },
  { type: 'OPERATOR', pattern: '([+\\-*/=<>!&|])+|==|!=|<=|>=|&&|\\|\\|' },
  { type: 'DELIMITER', pattern: '[(){};,.]' },
  { type: 'EOF', pattern: '\\$' }
];

const presets = JSON.parse(fs.readFileSync('data/presets.json', 'utf8'));

function tokenize(source) {
  const tokens = [];
  let pos = 0;
  
  while (pos < source.length) {
    let matched = false;
    
    for (const rule of tokenRules) {
      const regex = new RegExp(`^${rule.pattern}`);
      const match = source.slice(pos).match(regex);
      
      if (match) {
        if (rule.type !== 'WHITESPACE' && rule.type !== 'COMMENT') {
          tokens.push({
            type: rule.type,
            value: match[0],
            start: pos,
            end: pos + match[0].length
          });
        }
        pos += match[0].length;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      tokens.push({
        type: 'ERROR',
        value: source[pos],
        start: pos,
        end: pos + 1
      });
      pos++;
    }
  }
  
  tokens.push({ type: 'EOF', value: '$', start: pos, end: pos });
  return tokens;
}

function parse(tokens) {
  const ast = { type: 'Program', children: [] };
  const stack = [ast];
  const parseStack = [];
  let tokenIndex = 0;
  const steps = [];
  
  function createStatement(parent, token) {
    if (token.type === 'KEYWORD' && ['var', 'let', 'const'].includes(token.value)) {
      return { type: 'VariableDeclaration', kind: token.value, children: [] };
    }
    if (token.type === 'IDENTIFIER') {
      return { type: 'ExpressionStatement', children: [] };
    }
    if (token.type === 'KEYWORD' && token.value === 'if') {
      return { type: 'IfStatement', children: [] };
    }
    if (token.type === 'DELIMITER' && token.value === '{') {
      return { type: 'BlockStatement', body: [] };
    }
    return { type: 'Statement', children: [] };
  }
  
  while (tokenIndex < tokens.length && stack.length > 0) {
    const currentNode = stack[stack.length - 1];
    const currentToken = tokens[tokenIndex];
    
    if (currentToken.type === 'EOF') {
      parseStack.push({ action: 'ACCEPT', token: currentToken });
      break;
    }
    
    let matched = false;
    
    if (currentNode.type === 'Program') {
      const statement = createStatement(currentNode, currentToken);
      currentNode.children.push(statement);
      stack.push(statement);
      parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
      tokenIndex++;
      matched = true;
    } else if (currentNode.type === 'Statement') {
      const child = createStatement(currentNode, currentToken);
      currentNode.children.push(child);
      stack.push(child);
      parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
      tokenIndex++;
      matched = true;
    } else if (currentNode.type === 'VariableDeclaration') {
      if (currentToken.type === 'IDENTIFIER') {
        currentNode.id = { type: 'Identifier', name: currentToken.value };
        parseStack.push({ action: 'REDUCE', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'OPERATOR' && currentToken.value === '=') {
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'NUMBER') {
        currentNode.init = { type: 'Literal', value: parseInt(currentToken.value), raw: currentToken.value };
        parseStack.push({ action: 'REDUCE', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'STRING') {
        currentNode.init = { type: 'Literal', value: currentToken.value.slice(1, -1), raw: currentToken.value };
        parseStack.push({ action: 'REDUCE', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'DELIMITER' && currentToken.value === ';') {
        stack.pop();
        parseStack.push({ action: 'POP', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      }
    } else if (currentNode.type === 'ExpressionStatement') {
      if (currentToken.type === 'IDENTIFIER') {
        currentNode.expression = { type: 'Identifier', name: currentToken.value };
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'DELIMITER' && currentToken.value === ';') {
        stack.pop();
        parseStack.push({ action: 'POP', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      }
    } else if (currentNode.type === 'Identifier') {
      if (currentToken.type === 'OPERATOR') {
        const parent = stack[stack.length - 2];
        const binary = { type: 'BinaryExpression', operator: currentToken.value, left: currentNode };
        if (parent.type === 'ExpressionStatement') {
          parent.expression = binary;
        } else if (parent.type === 'BinaryExpression') {
          parent.right = binary;
        }
        stack[stack.length - 1] = binary;
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'DELIMITER' && currentToken.value === ';') {
        stack.pop();
        parseStack.push({ action: 'POP', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      }
    } else if (currentNode.type === 'BinaryExpression') {
      if (!currentNode.right) {
        if (currentToken.type === 'IDENTIFIER') {
          currentNode.right = { type: 'Identifier', name: currentToken.value };
          parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
          tokenIndex++;
          matched = true;
        } else if (currentToken.type === 'NUMBER') {
          currentNode.right = { type: 'Literal', value: parseInt(currentToken.value), raw: currentToken.value };
          parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
          tokenIndex++;
          matched = true;
        } else if (currentToken.type === 'STRING') {
          currentNode.right = { type: 'Literal', value: currentToken.value.slice(1, -1), raw: currentToken.value };
          parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
          tokenIndex++;
          matched = true;
        }
      } else if (currentToken.type === 'DELIMITER' && currentToken.value === ';') {
        stack.pop();
        parseStack.push({ action: 'POP', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      }
    } else if (currentNode.type === 'BlockStatement') {
      if (currentToken.type === 'DELIMITER' && currentToken.value === '}') {
        stack.pop();
        parseStack.push({ action: 'POP', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else {
        const statement = createStatement(currentNode, currentToken);
        currentNode.body.push(statement);
        stack.push(statement);
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      }
    } else if (currentNode.type === 'IfStatement') {
      if (currentToken.type === 'DELIMITER' && currentToken.value === '(') {
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'IDENTIFIER') {
        if (!currentNode.test) {
          currentNode.test = { type: 'Identifier', name: currentToken.value };
        }
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'OPERATOR') {
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'NUMBER') {
        currentNode.test = { type: 'Literal', value: parseInt(currentToken.value), raw: currentToken.value };
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'DELIMITER' && currentToken.value === ')') {
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'DELIMITER' && currentToken.value === '{') {
        const block = { type: 'BlockStatement', body: [] };
        currentNode.consequent = block;
        stack.push(block);
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      } else if (currentToken.type === 'KEYWORD' && currentToken.value === 'else') {
        parseStack.push({ action: 'SHIFT', token: currentToken, stack: [...stack.map(n => n.type)] });
        tokenIndex++;
        matched = true;
      }
    }
    
    if (!matched) {
      parseStack.push({
        action: 'ERROR',
        token: currentToken,
        message: `Unexpected token: ${currentToken.value}`
      });
      break;
    }
    
    steps.push({
      type: 'reduce',
      stack: [...parseStack],
      ast: JSON.parse(JSON.stringify(ast))
    });
  }
  
  return { ast, steps, parseStack };
}

function semanticAnalysis(ast) {
  const symbolTable = {};
  const errors = [];
  const scopes = [symbolTable];
  let maxScopeDepth = 0;
  
  function analyze(node, scopeDepth = 0) {
    if (scopeDepth > maxScopeDepth) {
      maxScopeDepth = scopeDepth;
    }
    if (!node) return;
    
    if (node.type === 'VariableDeclaration') {
      const varName = node.id?.name;
      if (varName && scopes[scopes.length - 1][varName]) {
        errors.push({
          type: 'redeclaration',
          message: `Variable '${varName}' already declared`,
          position: node.position
        });
      } else if (varName) {
        scopes[scopes.length - 1][varName] = {
          type: node.typeAnnotation?.typeName?.name || 'any',
          value: null,
          scopeDepth
        };
      }
    }
    
    if (node.type === 'Identifier') {
      const varName = node.name;
      let found = false;
      for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i][varName]) {
          found = true;
          break;
        }
      }
      if (!found) {
        errors.push({
          type: 'undefined',
          message: `Variable '${varName}' is not defined`,
          position: node.position
        });
      }
    }
    
    if (node.type === 'BinaryExpression') {
      analyze(node.left, scopeDepth);
      analyze(node.right, scopeDepth);
      
      const leftType = inferType(node.left);
      const rightType = inferType(node.right);
      
      if (leftType !== rightType && leftType !== 'any' && rightType !== 'any') {
        errors.push({
          type: 'typeMismatch',
          message: `Type mismatch: ${leftType} ${node.operator} ${rightType}`,
          position: node.position
        });
      }
    }
    
    if (node.type === 'BlockStatement') {
      scopes.push({});
      if (node.body) {
        node.body.forEach(child => analyze(child, scopeDepth + 1));
      }
      scopes.pop();
    }
    
    if (node.children) {
      node.children.forEach(child => analyze(child, scopeDepth));
    }
    
    if (node.consequent) analyze(node.consequent, scopeDepth);
    if (node.alternate) analyze(node.alternate, scopeDepth);
    if (node.init) analyze(node.init, scopeDepth);
    if (node.test) analyze(node.test, scopeDepth);
    if (node.expression) analyze(node.expression, scopeDepth);
    if (node.left) analyze(node.left, scopeDepth);
    if (node.right) analyze(node.right, scopeDepth);
    if (node.id) analyze(node.id, scopeDepth);
  }
  
  function inferType(node) {
    if (!node) return 'any';
    if (node.type === 'Literal') {
      if (typeof node.value === 'number') return 'number';
      if (typeof node.value === 'string') return 'string';
      if (typeof node.value === 'boolean') return 'boolean';
    }
    if (node.type === 'Identifier') {
      for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i][node.name]) {
          return scopes[i][node.name].type;
        }
      }
    }
    if (node.type === 'BinaryExpression') {
      const leftType = inferType(node.left);
      const rightType = inferType(node.right);
      return leftType === rightType ? leftType : 'any';
    }
    return 'any';
  }
  
  analyze(ast);
  
  return { symbolTable: scopes[0], errors, scopes, maxScopeDepth };
}

app.post('/api/analyze', (req, res) => {
  const { source } = req.body;
  
  try {
    const tokens = tokenize(source);
    const { ast, steps, parseStack } = parse(tokens);
    const { symbolTable, errors, scopes, maxScopeDepth } = semanticAnalysis(ast);
    
    const hasParseError = parseStack.some(item => item.action === 'ERROR');
    const parseErrors = parseStack.filter(item => item.action === 'ERROR').map(item => ({
      type: 'syntax',
      message: item.message
    }));
    
    res.json({
      tokens,
      ast,
      parseSteps: steps,
      parseStack,
      symbolTable,
      semanticErrors: errors,
      parseErrors,
      scopes,
      maxScopeDepth,
      hasParseError
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/presets', (req, res) => {
  res.json(presets);
});

app.get('/api/preset/:id', (req, res) => {
  const preset = presets.presets.find(p => p.id === req.params.id);
  if (preset) {
    res.json(preset);
  } else {
    res.status(404).json({ error: 'Preset not found' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
