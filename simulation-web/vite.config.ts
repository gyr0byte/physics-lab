import { defineConfig, type Plugin } from 'vite';

/**
 * Strip the `crossorigin` attribute from <script> and <link> tags.
 * Android WebView's WebViewAssetLoader serves local assets over a
 * pseudo-HTTPS domain but does NOT include CORS headers in responses.
 * When Vite emits `<script type="module" crossorigin ...>`, Chromium
 * performs a CORS check, receives no `Access-Control-Allow-Origin`
 * header, and silently refuses to execute the module — resulting in a
 * blank page.
 */
function stripCrossorigin(): Plugin {
  return {
    name: 'strip-crossorigin',
    enforce: 'post',
    transformIndexHtml(html: string) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Prevent Vite from adding crossorigin to script/link tags
    // (Android WebView local assets don't serve CORS headers)
    modulePreload: false,
  },
  plugins: [stripCrossorigin()],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
