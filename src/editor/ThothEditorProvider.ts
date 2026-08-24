import * as vscode from 'vscode';
import { parseThothDocument, serializeThothDocument, ThothRequestData } from './ThothDocument.js';
import { executeThothRequest } from './HttpClient.js';
import { getWebviewHtml } from '../webview/template.js';

export class ThothEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'thoth.editor';

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ThothEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ThothEditorProvider.viewType,
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

    // Configure webview panel options
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview'),
        vscode.Uri.joinPath(this.context.extensionUri, 'resources')
      ]
    };

    // Set HTML content
    webviewPanel.webview.html = getWebviewHtml(webviewPanel.webview, this.context.extensionUri);

    // Track state to avoid infinite update loops between document and webview
    let isUpdatingFromWebview = false;

    // Send initial data to webview
    const updateWebview = () => {
      if (isUpdatingFromWebview) return;
      const requestData = parseThothDocument(document.getText());
      webviewPanel.webview.postMessage({
        type: 'load',
        data: requestData
      });
    };

    updateWebview();

    // Listen for changes to document from outside (e.g. undo/redo or external edit)
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'edit': {
          isUpdatingFromWebview = true;
          try {
            const newContent = serializeThothDocument(message.data);
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

        case 'sendRequest': {
          const response = await executeThothRequest(message.request);
          webviewPanel.webview.postMessage({
            type: 'response',
            response
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
