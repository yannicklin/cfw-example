// vite.config.ts
// @ts-ignore
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: {
          configPath: "./ctm-cf-worker-router/wrangler.toml"
        }
      }
    },
    watch: false,
    coverage: {
      enabled: false,
      reportsDirectory: "./coverage",
      provider: "istanbul",
      exclude: [
        "**/*.test.ts",
        "**/*.test.js"
      ],
      //all: true,
      // coverage thresholds
      functions: 70,
      lines: 60,
      branches: 45,
      statements: 60
    },
    testTimeout: 60000,
    reporters: ["default", "html", "hanging-process"]
  }
});