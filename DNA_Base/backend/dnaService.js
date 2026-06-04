const { codonTable, getCodonUsageStats, updateCodonUsage } = require('./database');

function transcribe(dna) {
  const dnaToRna = { 'A': 'U', 'T': 'A', 'G': 'C', 'C': 'G' };
  let mrna = '';
  for (const base of dna.toUpperCase()) {
    if (dnaToRna[base]) {
      mrna += dnaToRna[base];
    }
  }
  return mrna;
}

function translate(mrna, startPos = 0) {
  const aminoAcids = [];
  const codons = [];
  let stopFound = false;
  let stopPosition = -1;

  for (let i = startPos; i < mrna.length - 2; i += 3) {
    const codon = mrna.substring(i, i + 3);
    const aa = codonTable[codon];
    
    if (aa) {
      codons.push({ codon, aminoAcid: aa, position: i });
      
      if (aa === 'Stop') {
        stopFound = true;
        stopPosition = i;
        break;
      }
      
      aminoAcids.push(aa);
    }
  }

  return {
    aminoAcids,
    codons,
    stopFound,
    stopPosition,
    translatedUntil: stopFound ? stopPosition + 3 : mrna.length
  };
}

function detectFrameshiftMutation(original, mutated) {
  const differences = [];
  const minLen = Math.min(original.length, mutated.length);
  
  for (let i = 0; i < minLen; i++) {
    if (original[i] !== mutated[i]) {
      differences.push({
        position: i,
        original: original[i],
        mutated: mutated[i]
      });
    }
  }

  const lenDiff = mutated.length - original.length;
  const isFrameshift = Math.abs(lenDiff) % 3 !== 0;

  return {
    differences,
    lengthDifference: lenDiff,
    isFrameshift,
    frameshiftType: lenDiff > 0 ? 'insertion' : lenDiff < 0 ? 'deletion' : 'none'
  };
}

function calculateGCContent(sequence) {
  const gc = (sequence.match(/[GC]/gi) || []).length;
  return sequence.length > 0 ? (gc / sequence.length * 100).toFixed(2) : 0;
}

function findRepeats(sequence, minRepeat = 3) {
  const repeats = [];
  const n = sequence.length;

  for (let len = 2; len <= n / minRepeat; len++) {
    for (let start = 0; start <= n - len * minRepeat; start++) {
      const unit = sequence.substring(start, start + len);
      let count = 1;
      let pos = start + len;
      
      while (pos <= n - len && sequence.substring(pos, pos + len) === unit) {
        count++;
        pos += len;
      }
      
      if (count >= minRepeat) {
        repeats.push({
          unit,
          start,
          end: pos - 1,
          count,
          length: count * len
        });
      }
    }
  }

  return repeats.sort((a, b) => b.length - a.length);
}

function analyzeSequence(dna) {
  const mrna = transcribe(dna);
  const translation = translate(mrna);
  const gcContent = calculateGCContent(dna);
  const repeats = findRepeats(dna);

  return {
    dna,
    mrna,
    translation,
    gcContent: parseFloat(gcContent),
    repeats: repeats.slice(0, 10)
  };
}

module.exports = {
  transcribe,
  translate,
  detectFrameshiftMutation,
  calculateGCContent,
  findRepeats,
  analyzeSequence,
  getCodonUsageStats,
  updateCodonUsage
};
