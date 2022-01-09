import * as vscode from "vscode";
import { addToIgnore, generateTypesCode } from "./code-generator";
import { askFile, askFolder, getCSSModuleFiles, isCSSModule } from "./utils";
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
          vscode.window.showErrorMessage(
            "Given URI is not a css module file (*.module.css)."
          );
        }
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "css-module-types-and-map.generate-for-folder",
      async (uri?: vscode.Uri) => {
        uri =
          uri instanceof vscode.Uri
            ? uri
            : await askFolder(context, {
                title: "Pick a folder for generating code...",
              });
        if (uri) {
          const files = await getCSSModuleFiles(uri);
          await Promise.all(files.map((file) => generateTypesCode(file)));
        }
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "css-module-types-and-map.add-to-gitignore",
      async (uri?: vscode.Uri) => {
        uri =
          uri instanceof vscode.Uri
            ? uri
            : await askFile({
                title: "Pick a '.gitignore' file for adding ignore pattern...",
                filters: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  "Git Ignore file": ["gitignore"],
                },
              });
        if (uri) {
          await addToIgnore(uri, context);
        }
      }
    )
  );
}
export function deactivate() {}
