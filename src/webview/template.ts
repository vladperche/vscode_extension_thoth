import * as vscode from 'vscode';

export function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'media', 'main.js'));
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
  <title>Thoth HTTP Request</title>
</head>
<body>
  <div class="thoth-container">
    <!-- Header -->
    <div class="thoth-header-bar">
      <div class="thoth-title-group">
        <img src="${iconUri}" class="thoth-icon" alt="Thoth Icon" />
        <input type="text" id="request-name" class="thoth-request-name-input" placeholder="Request Name" value="Request" />
      </div>
      <div class="thoth-actions-top">
        <button id="btn-save" class="btn btn-secondary" title="Save File (Ctrl+S)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save
        </button>
      </div>
    </div>

    <!-- Request Bar -->
    <div class="thoth-card">
      <div class="thoth-request-row">
        <select id="request-method" class="thoth-method-select" data-method="GET">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
          <option value="HEAD">HEAD</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>
        <input type="text" id="request-url" class="thoth-url-input" placeholder="https://api.example.com/endpoint" />
      </div>
    </div>

    <!-- Grouped Query Parameters & Headers Tabs -->
    <div class="thoth-card">
      <div class="thoth-tabs-header">
        <div class="thoth-tabs">
          <div id="tab-req-query" class="tab-item active">
            Query Parameters <span id="badge-query-count" class="tab-badge">0</span>
          </div>
          <div id="tab-req-headers" class="tab-item">
            Headers <span id="badge-headers-count" class="tab-badge">0</span>
          </div>
        </div>
        <div class="thoth-tab-actions">
          <button id="btn-add-query" class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Add Parameter
          </button>
          <button id="btn-add-header" class="btn-icon" style="display: none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Add Header
          </button>
        </div>
      </div>
      <div id="panel-req-query" class="tab-panel">
        <div id="query-table-body"></div>
      </div>
      <div id="panel-req-headers" class="tab-panel" style="display: none;">
        <div id="headers-table-body"></div>
      </div>
    </div>

    <!-- Body -->
    <div class="thoth-card">
      <div class="thoth-section-header">
        <span class="thoth-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Body
        </span>
        <div class="thoth-body-controls">
          <select id="body-type" class="thoth-body-type-select">
            <option value="json">JSON</option>
            <option value="text">Text / Raw</option>
            <option value="none">None</option>
          </select>
          <button id="btn-format-body" class="btn-icon">Format JSON</button>
        </div>
      </div>
      <textarea id="body-textarea" class="thoth-body-textarea" placeholder="{ &#10;  &quot;key&quot;: &quot;value&quot;&#10;}"></textarea>
    </div>

    <!-- Send & Environment Row -->
    <div class="thoth-send-bar">
      <div class="thoth-env-group">
        <label for="request-env-select" class="thoth-env-label">Environment:</label>
        <select id="request-env-select" class="thoth-env-select">
          <option value="$shared">$shared</option>
        </select>
      </div>
      <button id="btn-send" class="btn btn-send">[ SEND ]</button>
    </div>

    <!-- Response -->
    <div id="response-section" class="thoth-card thoth-response-card" style="display: none;">
      <div class="thoth-section-header">
        <span class="thoth-section-title">Response</span>
        <button id="btn-copy-response" class="btn-icon">Copy Response</button>
      </div>
      <div class="thoth-response-status-bar">
        <span id="response-status" class="badge">200 OK</span>
        <span id="response-time" class="badge badge-metric">142 ms</span>
        <span id="response-size" class="badge badge-metric">1.2 KB</span>
      </div>
      <div class="thoth-tabs">
        <div id="tab-body" class="tab-item active">Body</div>
        <div id="tab-headers" class="tab-item">Headers</div>
      </div>
      <pre id="response-content" class="thoth-response-viewer"></pre>
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
