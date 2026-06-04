class State {
  constructor() {
    this.len = 0;
    this.link = -1;
    this.next = {};
  }
}

class SuffixAutomaton {
  constructor() {
    this.size = 1;
    this.last = 0;
    this.states = [new State()];
  }

  extend(c) {
    const cur = this.size++;
    this.states.push(new State());
    this.states[cur].len = this.states[this.last].len + 1;
    let p = this.last;
    
    while (p !== -1 && !this.states[p].next[c]) {
      this.states[p].next[c] = cur;
      p = this.states[p].link;
    }
    
    if (p === -1) {
      this.states[cur].link = 0;
    } else {
      const q = this.states[p].next[c];
      if (this.states[p].len + 1 === this.states[q].len) {
        this.states[cur].link = q;
      } else {
        const clone = this.size++;
        this.states.push(new State());
        this.states[clone].len = this.states[p].len + 1;
        this.states[clone].next = { ...this.states[q].next };
        this.states[clone].link = this.states[q].link;
        
        while (p !== -1 && this.states[p].next[c] === q) {
          this.states[p].next[c] = clone;
          p = this.states[p].link;
        }
        
        this.states[q].link = clone;
        this.states[cur].link = clone;
      }
    }
    this.last = cur;
  }

  build(s) {
    for (const c of s) {
      this.extend(c);
    }
  }

  contains(s) {
    let cur = 0;
    for (const c of s) {
      if (!this.states[cur].next[c]) return false;
      cur = this.states[cur].next[c];
    }
    return true;
  }

  longestCommonSubstring(s) {
    let cur = 0;
    let len = 0;
    let bestLen = 0;
    let bestPos = 0;

    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      while (cur !== 0 && !this.states[cur].next[c]) {
        cur = this.states[cur].link;
        len = this.states[cur].len;
      }
      
      if (this.states[cur].next[c]) {
        cur = this.states[cur].next[c];
        len++;
      }
      
      if (len > bestLen) {
        bestLen = len;
        bestPos = i;
      }
    }

    return {
      length: bestLen,
      substring: s.substring(bestPos - bestLen + 1, bestPos + 1),
      endPosition: bestPos
    };
  }
}

function longestCommonSubsequence(s1, s2) {
  const sa = new SuffixAutomaton();
  sa.build(s1);
  return sa.longestCommonSubstring(s2);
}

function findPalindromicSequences(s, minLength = 4) {
  const palindromes = [];
  
  for (let center = 0; center < s.length; center++) {
    for (let d = 0; d < 2; d++) {
      let left = center;
      let right = center + d;
      
      while (left >= 0 && right < s.length && s[left] === s[right]) {
        const len = right - left + 1;
        if (len >= minLength) {
          palindromes.push({
            start: left,
            end: right,
            length: len,
            sequence: s.substring(left, right + 1)
          });
        }
        left--;
        right++;
      }
    }
  }
  
  return palindromes.sort((a, b) => b.length - a.length);
}

function findHairpinStructures(s, minStem = 4, maxLoop = 8) {
  const hairpins = [];
  
  for (let i = 0; i < s.length; i++) {
    for (let loopLen = 3; loopLen <= maxLoop; loopLen++) {
      for (let stemLen = minStem; stemLen <= 20; stemLen++) {
        const start = i;
        const loopStart = i + stemLen;
        const loopEnd = loopStart + loopLen;
        const end = loopEnd + stemLen;
        
        if (end > s.length) break;
        
        const stem1 = s.substring(start, loopStart);
        const stem2 = s.substring(loopEnd, end);
        const loop = s.substring(loopStart, loopEnd);
        
        if (isComplementary(stem1, stem2)) {
          hairpins.push({
            start,
            end: end - 1,
            stemLength: stemLen,
            loop,
            loopLength: loopLen,
            stem1,
            stem2,
            fullSequence: s.substring(start, end)
          });
        }
      }
    }
  }
  
  return hairpins;
}

function isComplementary(s1, s2) {
  const comp = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
  if (s1.length !== s2.length) return false;
  
  for (let i = 0; i < s1.length; i++) {
    if (comp[s1[i]] !== s2[s2.length - 1 - i]) {
      return false;
    }
  }
  return true;
}

module.exports = {
  SuffixAutomaton,
  longestCommonSubsequence,
  findPalindromicSequences,
  findHairpinStructures
};
