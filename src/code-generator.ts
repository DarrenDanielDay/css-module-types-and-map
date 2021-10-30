import * as vscode from "vscode";
import * as sourcemap from "source-map";
import { analyse } from "./analyser";
import { LF, Position, readFileAsText, writeFileText } from "./utils";
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

export async function generateTypesCode(uri: vscode.Uri): Promise<void> {
  const dtsUri = uri.with({ path: uri.path + ".d.ts" });
  const sourceMapUri = dtsUri.with({ path: dtsUri.path + ".map" });
  const dtsRelativePath = path.relative(
    path.dirname(sourceMapUri.fsPath),
    dtsUri.fsPath
  );
  const sourceMapRelativePath = path.relative(
    path.dirname(dtsUri.fsPath),
    sourceMapUri.fsPath
  );
  const content = await readFileAsText(uri);
  const analysed = analyse(content);
  const generator = new sourcemap.SourceMapGenerator({
    file: dtsRelativePath,
    sourceRoot: "",
  });
  const codeLines: string[] = [];
  const source = path.parse(uri.fsPath).base;
  const addLineAndMapping = (() => {
    let generatedLine = 0;
    return (line: string, column?: number, definition?: Position) => {
      codeLines.push(line);
      if (column && definition) {
        generator.addMapping({
          source,
          generated: {
            line: ++generatedLine,
            column,
          },
          original: {
            line: definition.line + 1,
            column: definition.offset,
          },
        });
      } else {
        // @ts-ignore
        generator.addMapping({
          generated: {
            line: ++generatedLine,
            column: 0,
          },
        });
      }
    };
  })();
  const variableName = "styles";
  addLineAndMapping("// This file is generated. NEVER MODIFY IT!");
  addLineAndMapping(`declare const ${variableName}: {`);
  const linePrefix = "  readonly ";
  analysed.forEach(([name, className]) => {
    const { firstDefinition } = className;
    const hasSpecial = [...name].some((char) => specials.has(char));
    const columnOffset = linePrefix.length + +hasSpecial;
    addLineAndMapping(
      `${linePrefix}${hasSpecial ? `"${name}"` : name}: string;`,
      columnOffset,
      firstDefinition
    );
  });
  addLineAndMapping("};");
  addLineAndMapping(`export default ${variableName};`);
  addLineAndMapping(`//# sourceMappingURL=${sourceMapRelativePath}`);

  const dtsCode = codeLines.join(LF);
  const sourceMapCode = generator.toString();
  await Promise.all([
    writeFileText(dtsUri, dtsCode),
    writeFileText(sourceMapUri, sourceMapCode),
  ]);
}
