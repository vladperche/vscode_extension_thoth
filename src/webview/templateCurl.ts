import * as vscode from 'vscode';

export function getCurlWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
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
  <title>Show cURL</title>
</head>
<body>
  <div class="thoth-container">
    <!-- Header -->
    <div class="thoth-header-bar">
      <div class="thoth-title-group">
        <img src="${iconUri}" class="thoth-icon" alt="Thoth Icon" />
        <span id="curl-title" style="font-size: 16px; font-weight: 600; color: var(--thoth-fg);">cURL Command</span>
      </div>
      <div class="thoth-actions-top">
        <button id="btn-copy-curl" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          Copy cURL
        </button>
      </div>
    </div>

    <!-- cURL Display Card -->
    <div class="thoth-card">
      <div class="thoth-section-header">
        <span class="thoth-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
          Read-Only cURL Command
        </span>
      </div>
      <pre id="curl-code-block" class="thoth-response-viewer" style="max-height: 500px; font-size: 13px; color: #34d399;"></pre>
    </div>
  </div>

  <script nonce="${nonce}">
    (function() {
      const elTitle = document.getElementById('curl-title');
      const elCode = document.getElementById('curl-code-block');
      const elBtnCopy = document.getElementById('btn-copy-curl');

      let currentCurlText = '';

      window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'loadCurl') {
          elTitle.textContent = (message.name || 'Request') + ' (cURL)';
          currentCurlText = message.curl || '';
          elCode.textContent = currentCurlText;
        }
      });

      elBtnCopy.addEventListener('click', () => {
        if (!currentCurlText) return;
        navigator.clipboard.writeText(currentCurlText).then(() => {
          const origText = elBtnCopy.innerHTML;
          elBtnCopy.textContent = 'Copied!';
          setTimeout(() => {
            elBtnCopy.innerHTML = origText;
          }, 1500);
        });
      });
    })();
  </script>
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
