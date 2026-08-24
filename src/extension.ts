import * as vscode from 'vscode';
import { ThothEditorProvider } from './editor/ThothEditorProvider.js';
import { ThothCurlEditorProvider } from './editor/ThothCurlEditorProvider.js';
import { createDefaultThothRequest, serializeThothDocument } from './editor/ThothDocument.js';

export function activate(context: vscode.ExtensionContext) {
  // Register custom editor providers for *.thoth files
  context.subscriptions.push(ThothEditorProvider.register(context));
  context.subscriptions.push(ThothCurlEditorProvider.register(context));

  // Register command to create a new Thoth HTTP Request file
  const newRequestCommand = vscode.commands.registerCommand('thoth.newRequest', async () => {
    const defaultData = createDefaultThothRequest();
    const defaultContent = serializeThothDocument(defaultData);

    const doc = await vscode.workspace.openTextDocument({
      language: 'thoth',
      content: defaultContent
    });

    await vscode.window.showTextDocument(doc);
  });

  context.subscriptions.push(newRequestCommand);
}

export function deactivate() {}
