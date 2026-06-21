import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getDynamicFallbackWord, generateLocalQuizOnServer, masterVocabularyListOnServer } from "./src/utils/fallbackGenerator";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gen AI Hub using server secret
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API Endpoint: Dynamic HSK Pronunciation & Context Generator
app.post("/api/explain", async (req, res) => {
  const { character, pinyin, english, level, category } = req.body || {};
  try {
    if (!character) {
      return res.status(400).json({ error: "Character is required." });
    }

    // 1. Try resolving offline (from preloaded database or standard fallbacks)
    const offlineWord = getDynamicFallbackWord(character, pinyin, english, level, category);
    const isGeneric = offlineWord.id.startsWith("fallback-dynamic-");

    if (!isGeneric) {
      console.log(`[Cache Hit] Word "${character}" resolved from pre-compiled static database.`);
      return res.json(offlineWord);
    }

    // 2. Query Gemini for on-the-fly custom words
    try {
      const promptText = `
User wants high-precision Bengali phonetic guidelines for learning Chinese HSK vocabulary.
Generate the accurate pronunciation, Bangla meaning, and a useful example sentence for this word:
Word: "${character}"
Pinyin: "${pinyin}"
English Meaning: "${english}"
Level: HSK ${level || 3}
Category: "${category || "General"}"

Requirements for the response:
1. "banglaPronounce": Provide an incredibly accurate Bengali spelling representation of how this word sounds, correcting any bad/awkward Bengali pinyin approximations. Take care to map Chinese phonemes correctly for a Bengali speaker. Use " / " if there are different accent variants.
2. "banglaMeaning": Simple, natural Bengali translation of "${english}".
3. "sentence": A simple, beginner-friendly Chinese example sentence using "${character}".
4. "sentencePinyin": Pinyin for the example sentence.
5. "sentenceEnglish": Accurate English translation of the example sentence.
6. "sentenceBangla": Clear and natural Bengali translation of the example sentence.
7. "phoneticBreakdown": A 1-2 sentence tip in Bengali explaining mouth positioning or tone hints (e.g., tone direction, unaspirated vs aspirated sounds like q vs ch, p vs b, etc.) for a Bengali native.

Return strictly a JSON object matching this TypeScript structure:
{
  "character": string,
  "pinyin": string,
  "english": string,
  "level": number,
  "category": string,
  "banglaPronounce": string,
  "banglaMeaning": string,
  "sentence": string,
  "sentencePinyin": string,
  "sentenceEnglish": string,
  "sentenceBangla": string,
  "phoneticBreakdown": string
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              character: { type: "STRING" },
              pinyin: { type: "STRING" },
              english: { type: "STRING" },
              level: { type: "INTEGER" },
              category: { type: "STRING" },
              banglaPronounce: { type: "STRING" },
              banglaMeaning: { type: "STRING" },
              sentence: { type: "STRING" },
              sentencePinyin: { type: "STRING" },
              sentenceEnglish: { type: "STRING" },
              sentenceBangla: { type: "STRING" },
              phoneticBreakdown: { type: "STRING" }
            },
            required: [
              "character", "pinyin", "english", "level", "category",
              "banglaPronounce", "banglaMeaning", "sentence",
              "sentencePinyin", "sentenceEnglish", "sentenceBangla",
              "phoneticBreakdown"
            ]
          }
        }
      });

      const parsedData = JSON.parse(response.text?.trim() || "{}");
      return res.json(parsedData);
    } catch (genError: any) {
      console.log(`[Cache Sync] Serving offline backup database card for: "${character}"`);
      return res.json({
        ...offlineWord,
        isFallback: true
      });
    }
  } catch (error: any) {
    console.log(`[Cache Sync] Request completed via offline backup path for character: "${character}"`);
    const fallbackWord = getDynamicFallbackWord(character, pinyin, english, level, category);
    return res.json({
      ...fallbackWord,
      isFallback: true
    });
  }
});

// API Endpoint: Daily Challenge Quiz Generator
app.post("/api/quiz-generate", async (req, res) => {
  const { level, length = 5 } = req.body;
  const requestedLevel = level || 1;

  try {
    try {
      const promptText = `
Generate an engaging interactive HSK Quiz for Bengali speakers learning Chinese.
HSK Level: ${requestedLevel}
Number of questions: ${length}

Each question should test either:
- Writing/Character recognition
- Pinyin reading
- Correct Bengali pronunciation selection
- Accurate English/Bengali meaning matching

For each question:
1. Provide a clear question in English/Bengali (e.g., "What is the correct Bengali pronunciation of '谢谢 (xièxie)'?").
2. Provide 4 distinct, plausible options.
3. Mark the exact 'correctAnswer'.
4. Include the 'word' object that was tested.

Return strictly a JSON array of questions, each matching this structure:
{
  "id": string (unique ID e.g. "q-1"),
  "type": "pinyin" | "bangla_pronounce" | "meaning" | "character",
  "questionText": string,
  "options": string[],
  "correctAnswer": string,
  "word": {
    "character": string,
    "pinyin": string,
    "english": string,
    "banglaPronounce": string,
    "banglaMeaning": string
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                type: { type: "STRING" },
                questionText: { type: "STRING" },
                options: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                },
                correctAnswer: { type: "STRING" },
                word: {
                  type: "OBJECT",
                  properties: {
                    character: { type: "STRING" },
                    pinyin: { type: "STRING" },
                    english: { type: "STRING" },
                    banglaPronounce: { type: "STRING" },
                    banglaMeaning: { type: "STRING" }
                  },
                  required: ["character", "pinyin", "english", "banglaPronounce", "banglaMeaning"]
                }
              },
              required: ["id", "type", "questionText", "options", "correctAnswer", "word"]
            }
          }
        }
      });

      const parsedQuiz = JSON.parse(response.text?.trim() || "[]");
      return res.json(parsedQuiz);
    } catch (genError: any) {
      console.log(`[Cache Sync] Serving offline backup quiz database for HSK Level: ${requestedLevel}`);
      const fallbackQuiz = generateLocalQuizOnServer(requestedLevel, length);
      return res.json(fallbackQuiz);
    }
  } catch (error: any) {
    console.log(`[Cache Sync] Completed quiz generation for HSK Level ${requestedLevel} using offline backup route.`);
    const fallbackQuiz = generateLocalQuizOnServer(requestedLevel, length);
    return res.json(fallbackQuiz);
  }
});

// API Endpoint: Word Lookup for exporting to Sheets
app.post("/api/words/lookup", (req, res) => {
  const { ids } = req.body || {};
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Word IDs array is required" });
  }

  // Filter master list to include matched ids
  const matched = masterVocabularyListOnServer.filter(word => ids.includes(word.id));
  return res.json({ words: matched });
});

// Vite Middleware & Static Output Configuration
if (process.env.NODE_ENV !== "production") {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Vite Dev Mode] Server running at http://0.0.0.0:${PORT}`);
    });
  };
  startVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Production Mode] Server running at http://0.0.0.0:${PORT}`);
  });
}
