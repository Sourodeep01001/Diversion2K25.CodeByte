import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { getAllSourceFilesWithCode } from '../helpers/getAllSourceFiles';
import { uploadToVectorDB } from '../helpers/uploadToVectorDB';
import { getEntryPoints } from '../helpers/getEntryPoints';

export class SidebarPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "modulens-sidebarview";
  private _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      if (data.command === 'fetchRoutes') {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
          webviewView.webview.postMessage({
        command: 'routesData',
        data: [],
        Status: 'No workspace found'
          });
          return;
        }
      if (data.command === 'showFlow') {
        vscode.commands.executeCommand('modulens.showFlow', data.routeName);
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "webview-ui", "build","assets", "sidebar.js")
    );
    const runtimeScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "webview-ui", "build","assets", "sjsx-runtime.js")
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "webview-ui", "build", "assets", "jsx-runtime.css")
    );
    const nonce = getNonce();
    return `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello World</title>
    <script type="module" crossorigin src="${scriptUri}"></script>
    <link rel="modulepreload" href="${runtimeScriptUri}">
    <link rel="stylesheet" href="${stylesUri}">
  </head>
  <body>
    <div id="root"></div>
    
  </body>
</html>
 `;
  }
}