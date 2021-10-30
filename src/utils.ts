import * as path from "path";
import * as util from "util";
import * as vscode from "vscode";
export interface Position {
  /**
   * zero-based index
   */
  line: number;
  /**
   * zero-based index
   */
  offset: number;
}
export function classSelector(className: string) {
  return `.${className}`;
}
export const LF = "\n";
export function getPositionOfOffset(text: string, offset: number): Position {
  const result: Position = {
    line: 0,
    offset: 0,
  };
  for (let index = 0; index < offset; index++) {
    const char = text[index];
    if (char === LF) {
      result.line++;
      result.offset = 0;
    } else {
      result.offset++;
    }
  }
  return result;
}

export function positionAdd(base: Position, delta: Position): Position {
  return {
    line: base.line + delta.line,
    offset: delta.offset,
  };
}

export function toVSCodePosition(position: Position): vscode.Position {
  return new vscode.Position(position.line, position.offset);
}

export async function readFileAsText(uri: vscode.Uri): Promise<string> {
  const buf = await vscode.workspace.fs.readFile(uri);
  return new util.TextDecoder().decode(buf);
}

export async function writeFileText(uri: vscode.Uri, content: string) {
  const buf = new util.TextEncoder().encode(content);
  await vscode.workspace.fs.writeFile(uri, buf);
}

export function isCSSModule(uri: vscode.Uri) {
  return path.parse(uri.fsPath).base.endsWith(".module.css");
}
