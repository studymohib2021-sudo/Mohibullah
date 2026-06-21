import { execSync } from "child_process";

try {
  console.log("Locating lingering Node tasks...");
  // Get all Node.js / tsx processes except our own pid
  const myPid = process.pid;
  const output = execSync("ps -ef").toString();
  const lines = output.split("\n");
  
  for (const line of lines) {
    if ((line.includes("node") || line.includes("tsx") || line.includes("generateHskWords") || line.includes("enrichHskIndices")) && !line.includes("killStaleNode")) {
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[1], 10);
      if (pid && pid !== myPid) {
        console.log(`Killing background process with PID: ${pid} (${parts.slice(7).join(" ")})`);
        try {
          process.kill(pid, "SIGKILL");
        } catch (e) {
          console.error(`Failed to kill process ${pid}:`, e);
        }
      }
    }
  }
  console.log("Cleanup complete!");
} catch (err) {
  console.error("Cleanup failed:", err);
}
