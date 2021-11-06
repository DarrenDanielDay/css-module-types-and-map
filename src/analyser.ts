import * as CSSWhat from "css-what";
import * as PostCSS from "postcss";
import {
  classSelector,
  debugLog,
  getPositionOfOffset,
  Position,
  positionAdd,
} from "./utils";

export interface ExportedName {
  name: string;
  def: Position;
}

export function analyse(text: string) {
  const ast = PostCSS.parse(text);
  const names = new Map<string, ExportedName>();
  ast.walk((node) => {
    const exportNames = analyseNode(node);
    for (const exportName of exportNames) {
      const { name } = exportName;
      if (!names.has(name)) {
        // Only the first definition of an exported name will be tracked.
        const ruleOffset: Position = {
          line: (node.source?.start?.line ?? 1) - 1,
          offset: (node.source?.start?.column ?? 1) - 1,
        };
        names.set(name, {
          ...exportName,
          def: positionAdd(ruleOffset, exportName.def),
        });
      }
    }
  });
  return [...names];
}

function analyseNode(node: PostCSS.Node): ExportedName[] {
  if (node instanceof PostCSS.Rule) {
    return analyseRule(node);
  }
  if (node instanceof PostCSS.AtRule) {
    return analyseAtRule(node);
  }
  return [];
}

function analyseRule(rule: PostCSS.Rule) {
  const analysedNames: ExportedName[] = [];
  let currentSearchOffset = 0;
  const fullSelector = rule.selector;
  const result = CSSWhat.parse(fullSelector);
  for (const group of result) {
    for (const token of group) {
      if (token.type === "attribute" && token.name === "class") {
        const { value: className } = token;
        const classNameSelector = classSelector(className);
        const searchedIndex = fullSelector.indexOf(
          classNameSelector,
          currentSearchOffset
        );
        currentSearchOffset = searchedIndex + classSelector.length;
        const offsetInSelector = getPositionOfOffset(
          fullSelector,
          searchedIndex
        );
        analysedNames.push({
          name: className,
          def: offsetInSelector,
        });
      }
    }
  }
  return analysedNames;
}

function analyseAtRule(atRule: PostCSS.AtRule) {
  const names: ExportedName[] = [];
  if (atRule.name === "value" && atRule.params) {
    const importReg = /(.+) from .+/is;
    const varReg = /([a-z][a-z0-9]*)\s*:.+/is;
    const importMatch = importReg.exec(atRule.params);
    const varMatch = varReg.exec(atRule.params);
    if (importMatch) {
      const [, importNameRawPatterns] = importMatch;
      const importPatterns = importNameRawPatterns.split(",");
      const importNamesOffsets = importPatterns.reduce<number[]>(
        (offsets, pattern) => {
          offsets.push((offsets[offsets.length - 1] ?? 0) + pattern.length + 1);
          return offsets;
        },
        []
      );
      importPatterns.forEach((pattern, i) => {
        const nameReg = /(.+as\s+)?(.+)/i;
        const nameMatch = nameReg.exec(pattern);
        if (nameMatch) {
          const [, rename, finalName] = nameMatch;
          names.push({
            name: finalName,
            def: getPositionOfOffset(
              atRule.params,
              (importNamesOffsets[i - 1] ?? 0) +
                nameMatch.index +
                (rename?.length ?? 0)
            ),
          });
        }
      });
    } else if (varMatch) {
      const [, varName] = varMatch;
      names.push({
        name: varName,
        def: { line: 0, offset: 0 },
      });
    } else {
      debugLog("Unsupported `@value` rule input:", atRule.params);
    }
  } else if (atRule.name === "keyframes") {
    names.push({ name: atRule.params, def: { line: 0, offset: 0 } });
  }
  const baseOffset: Position = {
    line: 0,
    offset: `@${atRule.name}`.length + (atRule.raws.afterName?.length ?? 0),
  };
  return names.map((exportName) => ({
    ...exportName,
    def: positionAdd(baseOffset, exportName.def),
  }));
}
