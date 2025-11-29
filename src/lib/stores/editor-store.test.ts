import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { sourceCodeStore } from './editor-store';

describe('editor-store', () => {
  beforeEach(() => {
    sourceCodeStore.set('');
  });

  describe('sourceCodeStore', () => {
    it('should initialize with empty string', () => {
      expect(get(sourceCodeStore)).toBe('');
    });

    it('should update source code', () => {
      const code = 'package main\n\nfunc main() {\n\tprintln("Hello")\n}';
      sourceCodeStore.set(code);
      expect(get(sourceCodeStore)).toBe(code);
    });

    it('should handle multiline code', () => {
      const code = `package main

import "fmt"

func main() {
\tfmt.Println("Hello, World!")
}`;
      sourceCodeStore.set(code);
      expect(get(sourceCodeStore)).toBe(code);
    });

    it('should handle empty code', () => {
      sourceCodeStore.set('package main');
      sourceCodeStore.set('');
      expect(get(sourceCodeStore)).toBe('');
    });

    it('should preserve whitespace', () => {
      const code = 'package  main\n\n\tfunc   test()  {}';
      sourceCodeStore.set(code);
      expect(get(sourceCodeStore)).toBe(code);
    });
  });
});
