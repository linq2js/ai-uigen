import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "debug-messages.log");

let cleared = false;

function ensureCleared() {
  if (!cleared) {
    fs.writeFileSync(LOG_FILE, "");
    cleared = true;
  }
}

export function logMessages(label: string, data: unknown) {
  if (process.env.NODE_ENV !== "development") return;

  ensureCleared();

  const timestamp = new Date().toISOString();
  const separator = "=".repeat(60);
  const entry = [
    "",
    separator,
    `[${timestamp}] ${label}`,
    separator,
    JSON.stringify(data, null, 2),
    "",
  ].join("\n");

  fs.appendFileSync(LOG_FILE, entry);
}
