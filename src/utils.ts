import * as path from "path";
import * as util from "util";
import * as vscode from "vscode";
const { fs } = vscode.workspace;
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
    offset: delta.line === 0 ? base.offset + delta.offset : delta.offset,
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

export async function isCSSModule(uri: vscode.Uri) {
  return (
    path.parse(uri.fsPath).base.endsWith(".module.css") &&
    (await fs.stat(uri)).type === vscode.FileType.File
  );
}

const lastUsedFolder = "css-module-types-and-map.last-used-folder";
export async function askFolder(context: vscode.ExtensionContext, config?: vscode.OpenDialogOptions) {
  const current = vscode.workspace.workspaceFolders?.[0]?.uri;
  const lastSelected = context.globalState.get(lastUsedFolder);
  const defaultUri =
    typeof lastSelected === "string" ? vscode.Uri.file(lastSelected) : current;
  const picked = await vscode.window.showOpenDialog({
    ...config,
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    defaultUri,
  });
  const result = picked?.[0];
  if (result instanceof vscode.Uri) {
    await context.globalState.update(lastUsedFolder, result.fsPath);
  }
  return result;
}

export async function askFile(config?: vscode.OpenDialogOptions) {
  const current = vscode.workspace.workspaceFolders?.[0]?.uri;
  const defaultUri = current && vscode.Uri.joinPath(current, '.gitignore');
  const picked = await vscode.window.showOpenDialog({
    ...config,
    canSelectFiles: true,
    canSelectMany: false,
    canSelectFolders: false,
    defaultUri
  });
  return picked?.[0];
}

export async function getCSSModuleFiles(
  uri: vscode.Uri
): Promise<vscode.Uri[]> {
  const result: vscode.Uri[] = [];
  async function dfs(uri: vscode.Uri) {
    const sub = await fs.readDirectory(uri);
    for (const [child, childType] of sub) {
      const childUri = vscode.Uri.joinPath(uri, child);
      if (childType === vscode.FileType.Directory) {
        await dfs(childUri);
      }
      if (childType === vscode.FileType.File && (await isCSSModule(childUri))) {
        result.push(childUri);
      }
    }
  }
  const { type } = await fs.stat(uri);
  if (type === vscode.FileType.Directory) {
    await dfs(uri);
  }
  return result;
}

const output = vscode.window.createOutputChannel("CSS Modules Types & Map");

export function debugLog(...args: unknown[]) {
  for (const arg of args) {
    output.appendLine(`${arg}`);
  }
}
