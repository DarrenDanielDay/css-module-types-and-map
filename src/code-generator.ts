import * as vscode from "vscode";
import * as vlq from "vlq";
import { analyse } from "./analyser";
import { LF, readFileAsText, writeFileText } from "./utils";
import * as path from "path";

export interface SingleFileSourceMap3Object {
  version: 3;
  file: string;
  sourceRoot: string;
  sources: string[];
  names: string[];
  mappings: string;
}

type MappingToken = [
  generatedCodeColumn: number,
  indexOfSources: number,
  sourceCodeLine: number,
  sourceCodeColumn: number,
  symbolRenameIndex?: number
];
const specials = new Set(["_", "-"]);

function tokenToString(token: MappingToken) {
  return token
    .filter((num): num is number => num !== undefined)
    .map((num) => vlq.encode(num))
    .join("");
}

export async function generateTypesCode(uri: vscode.Uri): Promise<void> {
  const dtsUri = uri.with({ path: uri.path + ".d.ts" });
  const sourceMapUri = dtsUri.with({ path: dtsUri.path + ".map" });
  const content = await readFileAsText(uri);
  const analysed = analyse(content);
  
  const codeLines: string[] = [];
  const mapping: string[] = [];
  function addLineAndMapping(line: string, map: string) {
    codeLines.push(line);
    mapping.push(map);
  }
  const variableName = "styles";
  addLineAndMapping("// This file is generated. NEVER MODIFY IT!", "");
  addLineAndMapping(`declare const ${variableName}: {`, "");
  const linePrefix = "  readonly ";
  analysed.forEach(([name, className]) => {
    const {
      firstDefinition: { line, offset },
    } = className;
    const hasSpecial = [...name].some((char) => specials.has(char));
    const columnOffset = linePrefix.length + +hasSpecial;
    addLineAndMapping(
      `${linePrefix}${hasSpecial ? `"${name}"` : name}: string;`,
      tokenToString([columnOffset, 0, line, offset])
    );
  });
  addLineAndMapping("};", "");
  addLineAndMapping(`export default ${variableName};`, "");
  const sourceMapRelativePath = path.relative(
    dtsUri.fsPath,
    sourceMapUri.fsPath
  );
  addLineAndMapping(`//# sourceMappingURL=${sourceMapRelativePath}`, "");

  const dtsCode = codeLines.join(LF);
  const dtsMap = {
    version: 3,
    file: path.parse(dtsUri.fsPath).base,
    sourceRoot: "",
    names: [],
    sources: ["./" + path.parse(uri.fsPath).base],
    mappings: mapping.join(";"),
  };

  await Promise.all([
    writeFileText(dtsUri, dtsCode),
    writeFileText(sourceMapUri, JSON.stringify(dtsMap)),
  ]);
}
