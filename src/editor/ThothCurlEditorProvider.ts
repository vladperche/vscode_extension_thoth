import * as vscode from 'vscode';
import { parseThothDocument } from './ThothDocument.js';
import { generateCurlCommand } from './CurlGenerator.js';
import { getCurlWebviewHtml } from '../webview/templateCurl.js';

export class ThothCurlEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'thoth.curlEditor';

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ThothCurlEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ThothCurlEditorProvider.viewType,
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

    webviewPanel.webview.html = getCurlWebviewHtml(webviewPanel.webview, this.context.extensionUri);

    const updateWebview = () => {
      const docData = parseThothDocument(document.getText());
      const curlText = generateCurlCommand(docData);
      webviewPanel.webview.postMessage({
        type: 'loadCurl',
        name: docData.name,
        curl: curlText
      });
    };

    updateWebview();

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }
}
