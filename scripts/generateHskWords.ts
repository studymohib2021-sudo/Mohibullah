import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is not defined.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function generateLevel(level: number, wordCount: number) {
  console.log(`Generating canonical HSK ${level} word index with exactly ${wordCount} words...`);
  
  // Larger batch size since plain text is extremely compact and fast to generate
  const batchSize = 150;
  const numBatches = Math.ceil(wordCount / batchSize);
  let allWords: any[] = [];
  
  for (let b = 0; b < numBatches; b++) {
    const startRange = b * batchSize + 1;
    const endRange = Math.min((b + 1) * batchSize, wordCount);
    const countToGenerate = endRange - startRange + 1;
    
    console.log(`- Generating batch ${b + 1}/${numBatches} (words ${startRange} to ${endRange}, count: ${countToGenerate})...`);
    
    const prompt = `Provide a plain text list of canonical HSK level ${level} vocabulary.
Each line must be formatted precisely as:
character|pinyin|category|english

Example:
唱歌|chànggē|Verb|to sing a song

Requirements:
- Provide exactly ${countToGenerate} unique Chinese words, from rank ${startRange} to ${endRange}.
- Do NOT include any intro, markdown, headers, or explanations. Start directly with the first word entry.
- Do NOT output bullet points or numbering.
- Only output entries belonging to HSK level ${level}.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.15
        }
      });
      
      const text = response.text;
      if (!text) {
        throw new Error(`Empty response returned from Gemini for level ${level} batch ${b + 1}`);
      }
      
      // Parse plain delimited text
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      let batchCount = 0;
      
      for (const line of lines) {
        if (line.includes("|")) {
          const parts = line.split("|");
          if (parts.length >= 4) {
            const char = parts[0].trim();
            const pin = parts[1].trim();
            const cat = parts[2].trim();
            const eng = parts[3].trim();
            
            // Skip headers or weird lines
            if (char.toLowerCase() === "character" || char.startsWith("-")) {
              continue;
            }
            
            allWords.push({
              character: char,
              pinyin: pin,
              english: eng,
              level: level,
              category: cat
            });
            batchCount++;
          }
        }
      }
      
      console.log(`  Successfully parsed ${batchCount} words in batch ${b + 1}.`);
    } catch (error) {
      console.error(`Error generating level ${level} batch ${b + 1}:`, error);
      console.log("Retrying batch in 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.3
        }
      });
      const text = response.text || "";
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.includes("|")) {
          const parts = line.split("|");
          if (parts.length >= 4) {
            allWords.push({
              character: parts[0].trim(),
              pinyin: parts[1].trim(),
              english: parts[3].trim(),
              level: level,
              category: parts[2].trim()
            });
          }
        }
      }
    }
    
    // Brief delay to prevent rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // De-duplicate words by character
  const seenChars = new Set<string>();
  const uniqueWords = allWords.filter(w => {
    if (seenChars.has(w.character)) return false;
    seenChars.add(w.character);
    return true;
  });
  
  console.log(`Level ${level} complete. Total words parsed: ${allWords.length}, unique: ${uniqueWords.length}.`);
  return uniqueWords;
}

async function main() {
  try {
    const hsk2 = await generateLevel(2, 150);
    const hsk3 = await generateLevel(3, 300);
    const hsk4 = await generateLevel(4, 600);
    
    // Write out separate module index files
    fs.writeFileSync(
      path.join(process.cwd(), "src/data/hsk2Index.ts"),
      `export const hsk2IndexWords = ${JSON.stringify(hsk2, null, 2)};\n`
    );
    console.log("Wrote src/data/hsk2Index.ts");
    
    fs.writeFileSync(
      path.join(process.cwd(), "src/data/hsk3Index.ts"),
      `export const hsk3IndexWords = ${JSON.stringify(hsk3, null, 2)};\n`
    );
    console.log("Wrote src/data/hsk3Index.ts");
    
    fs.writeFileSync(
      path.join(process.cwd(), "src/data/hsk4Index.ts"),
      `export const hsk4IndexWords = ${JSON.stringify(hsk4, null, 2)};\n`
    );
    console.log("Wrote src/data/hsk4Index.ts");
    
    console.log("All generation complete!");
  } catch (err) {
    console.error("Main execution failed:", err);
  }
}

main();
