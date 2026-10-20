import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { vercelToolbar } from "@vercel/toolbar/plugins/vite";
import { defineConfig } from "vite";

// The prototypes read the synthetic ward from prototypes/synthetic-ward at the repository root,
// which Vite serves because it sits inside the workspace.
// The Vercel Toolbar's plugin gives the page the deployment it belongs to, so comments attach to it.
export default defineConfig({
  plugins: [react(), tailwindcss(), vercelToolbar()],
});
