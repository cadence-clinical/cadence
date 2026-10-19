import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The prototypes read the synthetic ward from prototypes/synthetic-ward at the repository root,
// which Vite serves because it sits inside the workspace.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
