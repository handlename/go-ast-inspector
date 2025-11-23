import type { Position } from './types';

export class PositionMapper {
  private lineOffsets: number[] = [];

  constructor(sourceCode: string) {
    this.buildLineOffsets(sourceCode);
  }

  private buildLineOffsets(sourceCode: string): void {
    this.lineOffsets = [0];
    for (let i = 0; i < sourceCode.length; i++) {
      if (sourceCode[i] === '\n') {
        this.lineOffsets.push(i + 1);
      }
    }
  }

  offsetToPosition(offset: number): Position {
    let line = 0;
    for (let i = 0; i < this.lineOffsets.length; i++) {
      if (this.lineOffsets[i] > offset) {
        break;
      }
      line = i;
    }

    const column = offset - this.lineOffsets[line];

    return {
      line: line + 1,
      column: column + 1,
      offset,
    };
  }

  positionToOffset(line: number, column: number): number {
    const lineIndex = line - 1;
    if (lineIndex < 0 || lineIndex >= this.lineOffsets.length) {
      return -1;
    }
    return this.lineOffsets[lineIndex] + (column - 1);
  }
}
