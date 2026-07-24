import { spawn } from "node:child_process";
process.env.WRANGLER_LOG_PATH ??= ".wrangler/wrangler.log";

const command = process.platform === "win32" ? "vinext.cmd" : "vinext";
const child = spawn(command, ["build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
