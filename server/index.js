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

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

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

    const drugs = (parsed.drugs || []).map((brand) => ({
      brand,
      generic: drugMap[brand] || brand.toLowerCase(),
    }));

    const conflicts = await checkAllInteractions(drugs.map((d) => d.generic));

    res.json({ drugs, conflicts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
