import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "vitest.config.ts",
      ],
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
    // mode defines what ".env.{mode}" file to choose if exists
    env: {
      NODE_ENV: "test",
    },
  },
}));