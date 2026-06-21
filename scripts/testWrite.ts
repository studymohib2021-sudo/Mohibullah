import * as fs from "fs";
import * as path from "path";

const targetPath = path.join(process.cwd(), "src/data/hsk3Index.ts");
console.log("Writing test string to: ", targetPath);
fs.writeFileSync(targetPath, "// TEST WRITE SUCCESSFUL");
console.log("Write completed successfully!");
