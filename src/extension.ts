import * as vscode from "vscode";
import { generateTypesCode } from "./code-generator";
import { askFolder, getCSSModuleFiles, isCSSModule } from "./utils";
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      const { uri } = e;
      if (await isCSSModule(uri)) {
        await generateTypesCode(uri);
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "css-module-types-and-map.generate",
      async (uri?: vscode.Uri) => {
        uri = uri ?? vscode.window.activeTextEditor?.document?.uri;
        if (uri instanceof vscode.Uri && (await isCSSModule(uri))) {
          await generateTypesCode(uri);
        } else {
          vscode.window.showErrorMessage('Given URI is not a css module file (*.module.css).');
        }
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "css-module-types-and-map.generate-all",
      async (uri?: vscode.Uri) => {
        uri = uri instanceof vscode.Uri ? uri : await askFolder(context);
        if (uri) {
          const files = await getCSSModuleFiles(uri);
          await Promise.all(files.map((file) => generateTypesCode(file)));
        }
      }
    )
  );
}
export function deactivate() {}
