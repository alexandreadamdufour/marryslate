import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.ts"],
    testTimeout: 10000,
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
