import * as vscode from 'vscode';
import { parseThothDocument, serializeThothDocument } from './ThothDocument.js';
import { executeThothRequest } from './HttpClient.js';
import { getWebviewHtml } from '../webview/template.js';
import { resolveRequestVariablesWithRules } from '../services/VariableResolver.js';
import { discoverEnvironments } from '../services/EnvironmentDiscovery.js';
import { envStateService } from '../services/EnvironmentStateService.js';

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

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview'),
        vscode.Uri.joinPath(this.context.extensionUri, 'resources')
      ]
    };

    webviewPanel.webview.html = getWebviewHtml(webviewPanel.webview, this.context.extensionUri);

    let isUpdatingFromWebview = false;

    const updateWebview = async () => {
      if (isUpdatingFromWebview) return;
      const requestData = parseThothDocument(document.getText());
      webviewPanel.webview.postMessage({
        type: 'load',
        data: requestData
      });

      const envs = await discoverEnvironments(document.uri);
      const selectedEnv = envStateService.getSelectedEnvironment(document.uri);

      webviewPanel.webview.postMessage({
        type: 'environmentsList',
        environments: envs,
        selectedEnv
      });
    };

    await updateWebview();

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(async e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        await updateWebview();
      }
    });

    const applyDocumentUpdate = async (data: any) => {
      isUpdatingFromWebview = true;
      try {
        const newContent = serializeThothDocument(data);
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
    };

    webviewPanel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'selectEnv': {
          if (message.env) {
            envStateService.setSelectedEnvironment(document.uri, message.env);
          }
          break;
        }

        case 'edit': {
          await applyDocumentUpdate(message.data);
          break;
        }

        case 'save': {
          if (message.data) {
            await applyDocumentUpdate(message.data);
          }
          await document.save();
          break;
        }

        case 'sendRequest': {
          const selectedEnv = message.selectedEnv || envStateService.getSelectedEnvironment(document.uri);
          envStateService.setSelectedEnvironment(document.uri, selectedEnv);

          const resolveResult = await resolveRequestVariablesWithRules(
            message.request,
            selectedEnv,
            document.uri
          );

          if (resolveResult.error) {
            vscode.window.showErrorMessage(resolveResult.error);
            webviewPanel.webview.postMessage({
              type: 'response',
              response: {
                ok: false,
                status: 0,
                statusText: 'Variable Error',
                durationMs: 0,
                headers: {},
                body: resolveResult.error,
                contentType: 'text/plain',
                sizeBytes: 0,
                error: resolveResult.error
              }
            });
            break;
          }

          if (resolveResult.resolved) {
            const response = await executeThothRequest(resolveResult.resolved);
            webviewPanel.webview.postMessage({
              type: 'response',
              response
            });
          }
          break;
        }
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }
}
