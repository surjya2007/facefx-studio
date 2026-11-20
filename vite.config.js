import { defineConfig } from "vite";

export default defineConfig({
    base: "/facefx-studio/",
    build: {
        outDir: "dist",
        assetsDir: "assets"
    }
});