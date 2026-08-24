import * as vscode from 'vscode';
import { parseThothVarsDocument, serializeThothVarsDocument } from './ThothVarsDocument.js';
import { getVarsWebviewHtml } from '../webview/templateVars.js';

export class ThothVarsEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'thoth.varsEditor';

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ThothVarsEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ThothVarsEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    );
    return providerRegistration;
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview'),
        vscode.Uri.joinPath(this.context.extensionUri, 'resources')
      ]
    };

    webviewPanel.webview.html = getVarsWebviewHtml(webviewPanel.webview, this.context.extensionUri);

    let isUpdatingFromWebview = false;

    const updateWebview = () => {
      if (isUpdatingFromWebview) return;
      const data = parseThothVarsDocument(document.getText());
      webviewPanel.webview.postMessage({
        type: 'load',
        data: data
      });
    };

    updateWebview();

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'edit': {
          isUpdatingFromWebview = true;
          try {
            const newContent = serializeThothVarsDocument(message.data);
            if (newContent !== document.getText()) {
              const edit = new vscode.WorkspaceEdit();
              edit.replace(
                document.uri,
                new vscode.Range(0, 0, document.lineCount, 0),
                newContent
              );
              await vscode.workspace.applyEdit(edit);
            }
          } finally {
            isUpdatingFromWebview = false;
          }
          break;
        }

        case 'save': {
          await document.save();
          break;
        }

        case 'requestDeleteEnv': {
          if (message.env === '$shared') {
            vscode.window.showErrorMessage('The $shared environment cannot be deleted.');
            break;
          }

          const answer = await vscode.window.showWarningMessage(
            `Are you sure you want to delete environment '${message.env}'?`,
            { modal: true },
            'Delete'
          );

          webviewPanel.webview.postMessage({
            type: 'confirmDeleteEnvResult',
            confirmed: answer === 'Delete',
            env: message.env
          });
          break;
        }

        case 'requestDeleteVar': {
          const answer = await vscode.window.showWarningMessage(
            `Are you sure you want to delete variable '${message.key}' from environment '${message.env}'?`,
            { modal: true },
            'Delete'
          );

          webviewPanel.webview.postMessage({
            type: 'confirmDeleteVarResult',
            confirmed: answer === 'Delete',
            env: message.env,
            key: message.key
          });
          break;
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }
}
