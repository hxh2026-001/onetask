const express = require('express');
const cors = require('cors');
const { initDatabase, addSequence, getSequences, addMismatch, getMismatches } = require('./database');
const { 
  transcribe, 
  translate, 
  analyzeSequence,
  detectFrameshiftMutation,
  getCodonUsageStats,
  updateCodonUsage
} = require('./dnaService');
const {
  longestCommonSubsequence,
  findPalindromicSequences,
  findHairpinStructures
} = require('./suffixAutomaton');

const app = express();
const PORT = 3006;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DNA Decoding System API' });
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { sequence } = req.body;
    if (!sequence) {
      return res.status(400).json({ error: 'Sequence is required' });
    }
    
    const result = analyzeSequence(sequence);
    
    if (result.translation.codons.length > 0) {
      await updateCodonUsage(result.translation.codons);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transcribe', (req, res) => {
  try {
    const { sequence } = req.body;
    const mrna = transcribe(sequence);
    res.json({ dna: sequence, mrna });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/translate', (req, res) => {
  try {
    const { mrna, startPos = 0 } = req.body;
    const result = translate(mrna, startPos);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lcs', (req, res) => {
  try {
    const { seq1, seq2 } = req.body;
    const result = longestCommonSubsequence(seq1, seq2);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/palindromes', (req, res) => {
  try {
    const { sequence, minLength = 4 } = req.body;
    const result = findPalindromicSequences(sequence, minLength);
    res.json({ palindromes: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hairpins', (req, res) => {
  try {
    const { sequence, minStem = 4, maxLoop = 8 } = req.body;
    const result = findHairpinStructures(sequence, minStem, maxLoop);
    res.json({ hairpins: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/frameshift', (req, res) => {
  try {
    const { original, mutated } = req.body;
    const result = detectFrameshiftMutation(original, mutated);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/codon-usage', async (req, res) => {
  try {
    const stats = getCodonUsageStats();
    res.json({ codonUsage: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sequences', async (req, res) => {
  try {
    const sequences = await getSequences();
    res.json({ sequences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sequences', async (req, res) => {
  try {
    const { name, sequence, type } = req.body;
    const result = await addSequence(name, sequence, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mismatch', async (req, res) => {
  try {
    const { sequence_id, position, original_base, mutated_base, type } = req.body;
    const result = await addMismatch(sequence_id, position, original_base, mutated_base, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mismatches/:sequenceId', async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const mismatches = await getMismatches(sequenceId);
    res.json({ mismatches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`DNA Decoding System server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();
