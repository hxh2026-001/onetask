const codonTable = {
  'UUU': 'Phe', 'UUC': 'Phe', 'UUA': 'Leu', 'UUG': 'Leu',
  'CUU': 'Leu', 'CUC': 'Leu', 'CUA': 'Leu', 'CUG': 'Leu',
  'AUU': 'Ile', 'AUC': 'Ile', 'AUA': 'Ile', 'AUG': 'Met',
  'GUU': 'Val', 'GUC': 'Val', 'GUA': 'Val', 'GUG': 'Val',
  'UCU': 'Ser', 'UCC': 'Ser', 'UCA': 'Ser', 'UCG': 'Ser',
  'CCU': 'Pro', 'CCC': 'Pro', 'CCA': 'Pro', 'CCG': 'Pro',
  'ACU': 'Thr', 'ACC': 'Thr', 'ACA': 'Thr', 'ACG': 'Thr',
  'GCU': 'Ala', 'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala',
  'UAU': 'Tyr', 'UAC': 'Tyr', 'UAA': 'Stop', 'UAG': 'Stop',
  'CAU': 'His', 'CAC': 'His', 'CAA': 'Gln', 'CAG': 'Gln',
  'AAU': 'Asn', 'AAC': 'Asn', 'AAA': 'Lys', 'AAG': 'Lys',
  'GAU': 'Asp', 'GAC': 'Asp', 'GAA': 'Glu', 'GAG': 'Glu',
  'UGU': 'Cys', 'UGC': 'Cys', 'UGA': 'Stop', 'UGG': 'Trp',
  'CGU': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
  'AGU': 'Ser', 'AGC': 'Ser', 'AGA': 'Arg', 'AGG': 'Arg',
  'GGU': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly', 'GGG': 'Gly'
};

const codonUsage = {};
for (const [codon, aminoAcid] of Object.entries(codonTable)) {
  codonUsage[codon] = { codon, amino_acid: aminoAcid, usage_count: 0 };
}

const sequenceLibrary = [];
const mismatchStats = [];
let sequenceIdCounter = 1;
let mismatchIdCounter = 1;

function initDatabase() {
  return Promise.resolve();
}

function getCodonUsageStats() {
  return Object.values(codonUsage).sort((a, b) => b.usage_count - a.usage_count);
}

function updateCodonUsage(codons) {
  for (const { codon } of codons) {
    if (codonUsage[codon]) {
      codonUsage[codon].usage_count++;
    }
  }
  return Promise.resolve();
}

function addSequence(name, sequence, type) {
  const newSeq = {
    id: sequenceIdCounter++,
    name,
    sequence,
    type,
    created_at: new Date().toISOString()
  };
  sequenceLibrary.unshift(newSeq);
  return Promise.resolve(newSeq);
}

function getSequences() {
  return Promise.resolve([...sequenceLibrary]);
}

function addMismatch(sequence_id, position, original_base, mutated_base, type) {
  const mismatch = {
    id: mismatchIdCounter++,
    sequence_id,
    position,
    original_base,
    mutated_base,
    type,
    created_at: new Date().toISOString()
  };
  mismatchStats.push(mismatch);
  return Promise.resolve(mismatch);
}

function getMismatches(sequenceId) {
  return Promise.resolve(
    mismatchStats
      .filter(m => m.sequence_id == sequenceId)
      .sort((a, b) => a.position - b.position)
  );
}

module.exports = {
  initDatabase,
  codonTable,
  getCodonUsageStats,
  updateCodonUsage,
  addSequence,
  getSequences,
  addMismatch,
  getMismatches
};
