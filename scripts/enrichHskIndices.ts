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

// Helper to write file
function saveIndex(level: number, words: any[]) {
  const filePath = path.join(process.cwd(), `src/data/hsk${level}Index.ts`);
  fs.writeFileSync(
    filePath,
    `export const hsk${level}IndexWords = ${JSON.stringify(words, null, 2)};\n`
  );
  console.log(`Saved ${words.length} words to src/data/hsk${level}Index.ts`);
}

async function enrichLevel(level: number, currentList: any[], targetMin: number) {
  console.log(`\n--- Enriching HSK ${level} (Current: ${currentList.length}, Target: ${targetMin}) ---`);
  
  const existingChars = new Set<string>(currentList.map(w => w.character));
  let batchesRun = 0;
  const maxBatchesPerRun = 3;
  
  // We top up in batches of 50 words
  while (currentList.length < targetMin) {
    if (batchesRun >= maxBatchesPerRun) {
      console.log(`Reached maximum batch limit of ${maxBatchesPerRun} for this run. Exiting execution to avoid timeout. Please run the script again to continue enrichment.`);
      break;
    }
    batchesRun++;
    
    const needed = targetMin - currentList.length;
    const batchSize = Math.min(needed, 50);
    console.log(`Still need ${needed} words. Generating a batch of ${batchSize} (Batch ${batchesRun}/${maxBatchesPerRun} this run)...`);
    
    // Create an exclusion list containing all existing characters to guide it away
    const sampleExclusionsArr = Array.from(existingChars);
    const sampleExclusions = sampleExclusionsArr.join(", ");
    
    let lettersGroup = "A, B, C, D, E, F, G, H, J, K, L, M, N, P, Q, R, S, T, W, X, Y, Z";
    if (level === 4) {
      if (batchesRun === 1) lettersGroup = "A, B, C, D, E, F, G";
      else if (batchesRun === 2) lettersGroup = "H, J, K, L, M, N, P";
      else lettersGroup = "Q, R, S, T, W, X, Y, Z";
    }

    const letterConstraintCmd = level === 4 
      ? `- The Pinyin of the words MUST start with any of the letters: ${lettersGroup}. Do NOT generate words starting with other letters.`
      : "";

    const prompt = `Provide a plain text list of unique standard HSK level ${level} Chinese vocabulary.
Each line must be formatted precisely as:
character|pinyin|category|english

Requirements:
- Output exactly ${batchSize} unique Chinese words.
- Every entry MUST be a valid, standard HSK level ${level} word.
${letterConstraintCmd}
- Do NOT repeat any of these words: ${sampleExclusions}
- Only output the entries themselves. No intro, no explanation, no bullet points. Begin immediately with the first entry.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.2
        }
      });
      
      const text = response.text || "";
      console.log(`Debug - raw response text length: ${text.length}. Sample: ${text.slice(0, 150).replace(/\n/g, " [NL] ")}`);
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      let parsedCount = 0;
      
      for (const line of lines) {
        if (line.includes("|")) {
          const parts = line.split("|");
          if (parts.length >= 4) {
            const char = parts[0].trim();
            const pin = parts[1].trim();
            const cat = parts[2].trim();
            const eng = parts[3].trim();
            
            if (char.toLowerCase() === "character" || char.startsWith("-")) {
              continue;
            }
            
            if (!existingChars.has(char)) {
              currentList.push({
                character: char,
                pinyin: pin,
                english: eng,
                level,
                category: cat
              });
              existingChars.add(char);
              parsedCount++;
            }
          }
        }
      }
      
      console.log(`- Successfully parsed and appended ${parsedCount} new words in this batch.`);
      saveIndex(level, currentList);
      
      if (parsedCount === 0) {
        console.log("No new unique words were generated. Waiting 2 seconds and continuing...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error("Batch query error, skipping/retrying...", err);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Brief sleep to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log(`HSK ${level} enrichment completed successfully. Total size: ${currentList.length}`);
}

async function main() {
  try {
    // Dynamic import to avoid static require path checking at build-time in esbuild
    const hsk2Path = path.join(process.cwd(), "src/data/hsk2Index.ts");
    const hsk3Path = path.join(process.cwd(), "src/data/hsk3Index.ts");
    const hsk4Path = path.join(process.cwd(), "src/data/hsk4Index.ts");
    
    let hsk2: any[] = [];
    let hsk3: any[] = [];
    let hsk4: any[] = [];
    
    if (fs.existsSync(hsk2Path)) {
      const content = fs.readFileSync(hsk2Path, "utf-8");
      hsk2 = JSON.parse(content.replace(/export const hsk2IndexWords = /, "").replace(/;\s*$/, ""));
    }
    
    if (fs.existsSync(hsk3Path)) {
      const content = fs.readFileSync(hsk3Path, "utf-8");
      hsk3 = JSON.parse(content.replace(/export const hsk3IndexWords = /, "").replace(/;\s*$/, ""));
    }
    
    if (fs.existsSync(hsk4Path)) {
      const content = fs.readFileSync(hsk4Path, "utf-8");
      hsk4 = JSON.parse(content.replace(/export const hsk4IndexWords = /, "").replace(/;\s*$/, ""));
    }
    
    const targetLevelStr = process.argv[2];
    const targetLevel = targetLevelStr ? parseInt(targetLevelStr, 10) : null;
    
    // Enrich HSK2 to 150
    if (!targetLevel || targetLevel === 2) {
      await enrichLevel(2, hsk2, 150);
    }
    
    // Enrich HSK3 to 300
    if (!targetLevel || targetLevel === 3) {
      await enrichLevel(3, hsk3, 300);
    }
    
    // Enrich HSK4 to 600
    if (!targetLevel || targetLevel === 4) {
      await enrichLevel(4, hsk4, 600);
    }
    
    console.log("\nEnrichment pipeline complete!");
  } catch (err) {
    console.error("Enrichment main failed:", err);
  }
}

main();
