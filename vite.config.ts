import { readFileSync } from 'node:fs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { type Plugin, defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// WASMファイルをインライン化するカスタムプラグイン
function inlineWasmPlugin(): Plugin {
  return {
    name: 'inline-wasm',
    enforce: 'post',
    generateBundle(options, bundle) {
      // HTML内のWASMとwasm_exec.jsの参照をインライン化
      for (const fileName in bundle) {
        const file = bundle[fileName];

        if (file.type === 'asset' && fileName.endsWith('.html')) {
          let html = file.source as string;

          // parser.wasmをBase64エンコードしてインライン化
          try {
            const wasmBuffer = readFileSync('public/parser.wasm');
            const wasmBase64 = wasmBuffer.toString('base64');
            html = html.replace(
              /src="[^"]*parser\.wasm"/g,
              `src="data:application/wasm;base64,${wasmBase64}"`,
            );
            html = html.replace(/\/parser\.wasm/g, `data:application/wasm;base64,${wasmBase64}`);
          } catch (e) {
            console.warn('Could not inline parser.wasm:', e);
          }

          // wasm_exec.jsをインライン化
          try {
            const wasmExecJs = readFileSync('public/wasm_exec.js', 'utf-8');
            html = html.replace(
              /<script[^>]*src="[^"]*wasm_exec\.js"[^>]*><\/script>/g,
              `<script>${wasmExecJs}</script>`,
            );
          } catch (e) {
            console.warn('Could not inline wasm_exec.js:', e);
          }

          file.source = html;
        }
      }

      // parser.wasmとwasm_exec.jsを出力から削除
      for (const name in bundle) {
        if (name.includes('parser.wasm') || name.includes('wasm_exec.js')) {
          delete bundle[name];
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
      },
    }),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
    inlineWasmPlugin(),
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    copyPublicDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  base: './',
  resolve: {
    alias: {
      $lib: '/src/lib',
    },
  },
  publicDir: 'public',
});
