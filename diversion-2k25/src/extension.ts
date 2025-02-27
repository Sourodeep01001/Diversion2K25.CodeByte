import { commands, ExtensionContext } from "vscode";
import { RoutesPanel } from "./panels/RoutesPanel";
import { SidebarPanel } from "./panels/SidebarPanel";
import * as vscode from "vscode";

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showFlowCommand = commands.registerCommand("modulens.showFlow", (routeName: string) => {
    RoutesPanel.render(context.extensionUri, routeName);
  });

  const sidebarProvider = new SidebarPanel(context.extensionUri);

  const sidebarView = vscode.window.registerWebviewViewProvider(
    "modulens-sidebarview",
    sidebarProvider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    }
  );

  context.subscriptions.push(showFlowCommand, sidebarView);
}
