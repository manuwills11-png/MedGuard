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
      generic: drugMap[brand] || null,
    }));

    res.json({ drugs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
