import type { ASTNode, ParseResult } from './types';

declare global {
  interface Window {
    Go: new () => {
      importObject: WebAssembly.Imports;
      run(instance: WebAssembly.Instance): Promise<void>;
    };
    parseGoCode?: (sourceCode: string) => { ast?: string; error?: string };
  }
}

export class ParserBridge {
  private wasmInstance: WebAssembly.Instance | null = null;
  private isInitialized = false;

  async initialize(wasmUrl: string, wasmExecUrl: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.loadWasmExec(wasmExecUrl);

    const go = new window.Go();
    const result = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject);

    this.wasmInstance = result.instance;
    go.run(this.wasmInstance);

    this.isInitialized = true;
  }

  private async loadWasmExec(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load wasm_exec.js'));
      document.head.appendChild(script);
    });
  }

  parse(sourceCode: string): ParseResult {
    if (!this.isInitialized || !window.parseGoCode) {
      return {
        error: 'Parser not initialized',
      };
    }

    try {
      const result = window.parseGoCode(sourceCode);

      if (result.error) {
        return { error: result.error };
      }

      if (result.ast) {
        const ast: ASTNode = JSON.parse(result.ast);
        return { ast };
      }

      return { error: 'No AST returned' };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const parserBridge = new ParserBridge();
