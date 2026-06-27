const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3001;

const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const drugMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'drugs.json'), 'utf-8'));

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('MedGuard server is running');
});

const HIGH_SEVERITY_KEYWORDS = ['fatal', 'severe', 'contraindicated'];

async function checkInteraction(drug1, drug2) {
  const query = `drug_interactions:"${drug1}" AND "${drug2}"`;
  const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(query)}&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const text = (data.results[0].drug_interactions || []).join(' ').toLowerCase();
    const severity = HIGH_SEVERITY_KEYWORDS.some((word) => text.includes(word)) ? 'high' : 'moderate';

    return {
      drug1,
      drug2,
      severity,
      message: data.results[0].drug_interactions ? data.results[0].drug_interactions[0] : 'Potential interaction detected',
    };
  } catch (err) {
    console.error(`Interaction check failed for ${drug1} + ${drug2}:`, err);
    return null;
  }
}

async function checkAllInteractions(generics) {
  const unique = [...new Set(generics)];
  const pairs = [];
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      pairs.push([unique[i], unique[j]]);
    }
  }

  const results = await Promise.all(pairs.map(([a, b]) => checkInteraction(a, b)));
  return results.filter(Boolean);
}

// Run Groq vision on a single image buffer and return the array of brand names it found.
async function extractBrandsFromImage(buffer, mimeType) {
  const base64Image = buffer.toString('base64');

  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Look at this Indian pill strip image. Extract every drug name visible. Return JSON only: {drugs: [...]}. No explanation. JSON only.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0].message.content;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  return parsed.drugs || [];
}

// Map brand names to { brand, generic } objects, deduplicating by brand (case-insensitive).
function buildDrugList(brands) {
  const seen = new Set();
  const drugs = [];
  for (const brand of brands) {
    if (typeof brand !== 'string') continue;
    const key = brand.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    drugs.push({ brand, generic: drugMap[brand] || brand.toLowerCase() });
  }
  return drugs;
}

app.post('/api/analyze', upload.array('images', 4), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    // Run vision on every image in parallel, then merge + dedupe the brands.
    const brandArrays = await Promise.all(
      req.files.map((file) => extractBrandsFromImage(file.buffer, file.mimetype)),
    );
    const allBrands = brandArrays.flat();

    const drugs = buildDrugList(allBrands);
    const conflicts = await checkAllInteractions(drugs.map((d) => d.generic));

    res.json({ drugs, conflicts });
  } catch (err) {
    console.error('--- /api/analyze error ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('GROQ_API_KEY present:', Boolean(process.env.GROQ_API_KEY));
    console.error('Images received:', req.files ? req.files.length : 0);
    console.error('--------------------------');
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

app.post('/api/check-interactions', async (req, res) => {
  const generics = req.body && req.body.generics;
  if (!Array.isArray(generics) || generics.length === 0) {
    return res.status(400).json({ error: 'No medicines provided' });
  }

  try {
    const cleaned = generics.filter((g) => typeof g === 'string' && g.trim());
    const drugs = cleaned.map((generic) => ({ brand: generic, generic }));
    const conflicts = await checkAllInteractions(cleaned);

    res.json({ drugs, conflicts });
  } catch (err) {
    console.error('--- /api/check-interactions error ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('-------------------------------------');
    res.status(500).json({ error: 'Failed to check interactions' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
