import { defaultGlyphs, ligatureGlyphs, multiLangGlyphs } from "../db/client";

export interface GlyphMetric {
  width: number;
  height: number;
  advance: number;
  baseline: number;
}

export interface LineBreak {
  start: number;
  end: number;
  width: number;
  penalty: number;
  hyphenated: boolean;
}

export interface TypesetLine {
  characters: string[];
  positions: { x: number; y: number; baseline: number }[];
  width: number;
}

const ALL_GLYPHS = {
  ...defaultGlyphs.regular,
  ...ligatureGlyphs,
  ...multiLangGlyphs,
};

export function getGlyphMetrics(char: string, fontSize: number = 1): GlyphMetric {
  const baseMetric = ALL_GLYPHS[char];
  if (baseMetric) {
    return {
      width: baseMetric.width * fontSize,
      height: baseMetric.height * fontSize,
      advance: baseMetric.advance * fontSize,
      baseline: baseMetric.baseline * fontSize,
    };
  }
  return {
    width: 60 * fontSize,
    height: 80 * fontSize,
    advance: 60 * fontSize,
    baseline: 70 * fontSize,
  };
}

export function applyLigatures(text: string): string[] {
  const result: string[] = [];
  let i = 0;
  
  while (i < text.length) {
    let matched = false;
    
    for (const ligature of Object.keys(ligatureGlyphs).sort((a, b) => b.length - a.length)) {
      if (text.slice(i, i + ligature.length) === ligature) {
        result.push(ligature);
        i += ligature.length;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      result.push(text[i]);
      i++;
    }
  }
  
  return result;
}

export function calculateTotalWidth(characters: string[], fontSize: number, letterSpacing: number): number {
  let width = 0;
  for (const char of characters) {
    const metric = getGlyphMetrics(char, fontSize);
    width += metric.advance + letterSpacing;
  }
  return Math.max(0, width - letterSpacing);
}

export function knuthPlassLineBreaking(
  text: string,
  lineWidth: number,
  fontSize: number,
  letterSpacing: number,
  tolerance: number = 10
): LineBreak[] {
  const tokens = applyLigatures(text);
  const n = tokens.length;
  const breaks: LineBreak[] = [];
  
  const memo: Record<number, { cost: number; prev: number }> = {};
  memo[-1] = { cost: 0, prev: -1 };
  
  for (let i = 0; i < n; i++) {
    memo[i] = { cost: Infinity, prev: -1 };
    
    for (let j = Math.max(-1, i - 100); j < i; j++) {
      const segment = tokens.slice(j + 1, i + 1);
      const width = calculateTotalWidth(segment, fontSize, letterSpacing);
      
      if (width > lineWidth + tolerance) continue;
      
      const slack = lineWidth - width;
      const cost = memo[j].cost + Math.pow(slack, 3);
      
      if (cost < memo[i].cost) {
        memo[i] = { cost, prev: j };
      }
    }
  }
  
  let current = n - 1;
  const result: LineBreak[] = [];
  
  while (current >= 0) {
    const prev = memo[current].prev;
    result.unshift({
      start: prev + 1,
      end: current + 1,
      width: calculateTotalWidth(tokens.slice(prev + 1, current + 1), fontSize, letterSpacing),
      penalty: memo[current].cost - (prev >= 0 ? memo[prev].cost : 0),
      hyphenated: false,
    });
    current = prev;
  }
  
  return result;
}

export function typesetText(
  text: string,
  lineWidth: number,
  fontSize: number,
  letterSpacing: number,
  lineSpacing: number
): TypesetLine[] {
  const tokens = applyLigatures(text);
  const breaks = knuthPlassLineBreaking(text, lineWidth, fontSize, letterSpacing);
  
  const lines: TypesetLine[] = [];
  let y = 0;
  
  for (const lineBreak of breaks) {
    const lineChars = tokens.slice(lineBreak.start, lineBreak.end);
    const positions: { x: number; y: number; baseline: number }[] = [];
    let x = 0;
    
    for (const char of lineChars) {
      const metric = getGlyphMetrics(char, fontSize);
      positions.push({
        x,
        y: y + (lineSpacing - metric.height + metric.baseline),
        baseline: y + lineSpacing,
      });
      x += metric.advance + letterSpacing;
    }
    
    lines.push({
      characters: lineChars,
      positions,
      width: x - letterSpacing,
    });
    
    y += lineSpacing;
  }
  
  return lines;
}

export function optimizeDensity(lines: TypesetLine[], lineWidth: number): TypesetLine[] {
  const totalSlack = lines.reduce((acc, line) => acc + (lineWidth - line.width), 0);
  const totalChars = lines.reduce((acc, line) => acc + line.characters.length, 0);
  
  if (totalChars === 0 || totalSlack <= 0) return lines;
  
  const slackPerChar = totalSlack / totalChars;
  
  return lines.map(line => {
    const charCount = line.characters.length;
    const extraSpacing = charCount > 1 ? (slackPerChar * charCount) / (charCount - 1) : 0;
    
    const newPositions = line.positions.map((pos, i) => ({
      ...pos,
      x: pos.x + i * extraSpacing,
    }));
    
    return {
      ...line,
      positions: newPositions,
      width: line.width + (charCount > 1 ? extraSpacing * (charCount - 1) : 0),
    };
  });
}

export function simulateBlockingDelay(delay: number): void {
  const start = performance.now();
  while (performance.now() - start < delay) {
    Math.sqrt(Math.random());
  }
}
