import * as css from "css-what";
import * as postcss from "postcss";
import {
  classSelector,
  getPositionOfOffset,
  Position,
  positionAdd,
} from "./utils";

export interface ClassName {
  name: string;
  firstDefinition: Position;
}

export function analyse(text: string) {
  const ast = postcss.parse(text);
  const classes = new Map<string, ClassName>();
  ast.walk((node) => {
    if (node instanceof postcss.Rule) {
      const ruleOffset: Position = {
        line: (node.source?.start?.line ?? 1) - 1,
        offset: (node.source?.start?.column ?? 1) - 1,
      };
      let currentSearchOffset = 0;
      const fullSelector = node.selector;
      const result = css.parse(fullSelector);
      for (const group of result) {
        for (const token of group) {
          if (token.type === "attribute" && token.name === "class") {
            const { value: className } = token;
            if (!classes.has(className)) {
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
              classes.set(className, {
                name: className,
                firstDefinition: positionAdd(ruleOffset, offsetInSelector),
              });
            }
          }
        }
      }
    }
  });
  return [...classes];
}
