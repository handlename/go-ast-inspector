export interface ASTNode {
  type: string;
  pos: number;
  end: number;
  children: ASTNode[];
  metadata: Record<string, unknown>;
  fieldName?: string;
}

export interface ParseResult {
  ast?: ASTNode;
  error?: string;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export interface Position {
  line: number;
  column: number;
  offset: number;
}
