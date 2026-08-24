import * as vscode from 'vscode';

export function getVarsWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'media', 'vars.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'media', 'main.css'));
  const iconUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'icon.png'));

  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:;">
  <link href="${styleUri}" rel="stylesheet">
  <title>Thoth Variables Editor</title>
</head>
<body>
  <div class="thoth-container">
    <!-- Header Controls -->
    <div class="thoth-header-bar">
      <div class="thoth-title-group">
        <img src="${iconUri}" class="thoth-icon" alt="Thoth Icon" />
        <span style="font-size: 16px; font-weight: 600; color: var(--thoth-fg);">Thoth Variables</span>
      </div>
      <div class="thoth-actions-top">
        <button id="btn-save" class="btn btn-secondary" title="Save File (Ctrl+S)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save
        </button>
      </div>
    </div>

    <!-- Environment Selector Bar -->
    <div class="thoth-card">
      <div class="thoth-request-row">
        <label for="env-select" style="font-weight: 600; font-size: 13px;">Environment:</label>
        <select id="env-select" class="thoth-method-select" style="min-width: 160px; color: var(--thoth-fg);">
          <option value="$shared">$shared</option>
        </select>
        <button id="btn-add-env" class="btn btn-secondary" title="Add New Environment" style="padding: 6px 10px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button id="btn-del-env" class="btn btn-secondary" title="Delete Current Environment" style="padding: 6px 10px;" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
        </button>
      </div>
    </div>

    <!-- Variables Grid Table -->
    <div class="thoth-card">
      <div class="thoth-section-header">
        <span class="thoth-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          Variables (<span id="env-name-label">$shared</span>)
        </span>
        <button id="btn-add-var" class="btn-icon" title="Add Row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Add Row
        </button>
      </div>
      <div id="vars-table-header" class="thoth-kv-row" style="font-weight: 600; padding: 4px 0; border-bottom: 1px solid var(--thoth-border); margin-bottom: 8px;">
        <div style="flex: 1;">Variable</div>
        <div style="flex: 1;">Value</div>
        <div style="width: 28px;"></div>
      </div>
      <div id="vars-table-body"></div>
    </div>
  </div>

  <!-- Modal Prompt for New Environment Name -->
  <div id="env-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); align-items: center; justify-content: center; z-index: 100;">
    <div class="thoth-card" style="width: 320px; background: var(--thoth-input-bg); border: 1px solid var(--thoth-input-border);">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 10px;">New Environment Name</div>
      <input type="text" id="env-modal-input" class="thoth-url-input" placeholder="e.g. Development, Staging" style="width: 100%; margin-bottom: 12px;" />
      <div style="display: flex; justify-content: flex-end; gap: 8px;">
        <button id="env-modal-cancel" class="btn btn-secondary">Cancel</button>
        <button id="env-modal-confirm" class="btn btn-primary">Create</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
