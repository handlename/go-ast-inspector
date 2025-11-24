import type { ASTNode, Position } from './types';

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

  findNodeAtOffset(ast: ASTNode | null, offset: number): ASTNode | null {
    if (!ast) return null;

    // Check if offset is within this node's range
    if (offset < ast.pos || offset > ast.end) {
      return null;
    }

    // Search children for a more specific match
    if (ast.children && ast.children.length > 0) {
      for (const child of ast.children) {
        const childResult = this.findNodeAtOffset(child, offset);
        if (childResult) {
          return childResult;
        }
      }
    }

    // No child matched, so this node is the most specific match
    return ast;
  }
}
