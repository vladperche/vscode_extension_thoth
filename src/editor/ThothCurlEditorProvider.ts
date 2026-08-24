import * as vscode from 'vscode';
import { parseThothDocument } from './ThothDocument.js';
import { generateCurlCommand } from './CurlGenerator.js';
import { getCurlWebviewHtml } from '../webview/templateCurl.js';
import { resolveRequestVariablesWithRules } from '../services/VariableResolver.js';
import { envStateService } from '../services/EnvironmentStateService.js';

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

    const updateWebview = async () => {
      const docData = parseThothDocument(document.getText());
      const selectedEnv = envStateService.getSelectedEnvironment(document.uri);
      const resolveResult = await resolveRequestVariablesWithRules(docData, selectedEnv, document.uri);
      
      let curlText = '';
      if (resolveResult.error) {
        curlText = `# Error: ${resolveResult.error}`;
      } else if (resolveResult.resolved) {
        curlText = generateCurlCommand(resolveResult.resolved);
      }

      webviewPanel.webview.postMessage({
        type: 'loadCurl',
        name: docData.name,
        curl: curlText
      });
    };

    await updateWebview();

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(async e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        await updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }
}
