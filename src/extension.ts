import * as vscode from "vscode";
import { generateTypesCode } from "./code-generator";
import { isCSSModule } from "./utils";
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      const { uri } = e;
      if (isCSSModule(uri)) {
        await generateTypesCode(uri);
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "css-module-types-and-map.generate",
      (uri?: vscode.Uri) => {
        uri = uri ?? vscode.workspace.workspaceFile;
        if (uri instanceof vscode.Uri && isCSSModule(uri)) {
          generateTypesCode(uri);
        }
      }
    )
  );
}
export function deactivate() {}
