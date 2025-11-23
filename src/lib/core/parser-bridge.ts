import type { ASTNode, ParseResult } from "./types";

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

  async initialize(wasmUrl: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!window.Go) {
      throw new Error("wasm_exec.js not loaded");
    }

    const go = new window.Go();
    const result = await WebAssembly.instantiateStreaming(
      fetch(wasmUrl),
      go.importObject,
    );

    this.wasmInstance = result.instance;
    go.run(this.wasmInstance);

    this.isInitialized = true;
  }

  parse(sourceCode: string): ParseResult {
    if (!this.isInitialized || !window.parseGoCode) {
      return {
        error: "Parser not initialized",
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

      return { error: "No AST returned" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const parserBridge = new ParserBridge();
