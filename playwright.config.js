import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

// Carrega as credenciais do robô de .env.e2e (arquivo local, fora do git).
try {
  const env = fs.readFileSync(new URL("./.env.e2e", import.meta.url), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    // Testa como celular — é onde o app é usado de verdade.
    ...devices["Pixel 7"],
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
