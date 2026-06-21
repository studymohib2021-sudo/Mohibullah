import * as fs from "fs";
import * as path from "path";

function countWordsInFile(level: number) {
  const filePath = path.join(process.cwd(), `src/data/hsk${level}Index.ts`);
  if (!fs.existsSync(filePath)) {
    console.log(`HSK ${level}: File does not exist at ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const matches = content.match(/"character":/g);
  const count = matches ? matches.length : 0;
  console.log(`HSK ${level} Index words on disk: ${count}`);
}

countWordsInFile(2);
countWordsInFile(3);
countWordsInFile(4);
