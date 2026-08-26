(function () {
  const vscode = acquireVsCodeApi();
  const savedState = vscode.getState() || {};

  // State
  let state = {
    name: "Request",
    method: "GET",
    url: "",
    queryParams: [],
    headersParams: [],
    formParams: [],
    bodyText: "",
    bodyType: "json",
    response: null,
    activeTab: "body",
    activeReqTab: "query", // 'query' | 'headers' | 'body'
    selectedEnv: savedState.selectedEnv || "$shared",
    availableEnvs: ["$shared"],
    isSending: false
  };

  // DOM Elements
  const elName = document.getElementById("request-name");
  const elMethod = document.getElementById("request-method");
  const elUrl = document.getElementById("request-url");
  const elBtnSave = document.getElementById("btn-save");
  const elBtnSend = document.getElementById("btn-send");
  const elReqEnvSelect = document.getElementById("request-env-select");

  // Query, Headers & Body Tab Elements
  const elTabReqQuery = document.getElementById("tab-req-query");
  const elTabReqHeaders = document.getElementById("tab-req-headers");
  const elTabReqBody = document.getElementById("tab-req-body");
  const elPanelReqQuery = document.getElementById("panel-req-query");
  const elPanelReqHeaders = document.getElementById("panel-req-headers");
  const elPanelReqBody = document.getElementById("panel-req-body");
  const elBtnAddQuery = document.getElementById("btn-add-query");
  const elBtnAddHeader = document.getElementById("btn-add-header");
  const elBtnAddFormField = document.getElementById("btn-add-form-field");
  const elBadgeQuery = document.getElementById("badge-query-count");
  const elBadgeHeaders = document.getElementById("badge-headers-count");
  const elQueryTable = document.getElementById("query-table-body");
  const elHeadersTable = document.getElementById("headers-table-body");
  const elFormTable = document.getElementById("form-table-body");

  // Body Elements
  const elBodyType = document.getElementById("body-type");
  const elBodyTextarea = document.getElementById("body-textarea");
  const elBtnFormatBody = document.getElementById("btn-format-body");

  // Response Elements
  const elResponseSection = document.getElementById("response-section");
  const elResponseStatus = document.getElementById("response-status");
  const elResponseTime = document.getElementById("response-time");
  const elResponseSize = document.getElementById("response-size");
  const elTabBody = document.getElementById("tab-body");
  const elTabHeaders = document.getElementById("tab-headers");
  const elResponseContent = document.getElementById("response-content");
  const elBtnCopyResponse = document.getElementById("btn-copy-response");

  // Helper ID generator
  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  // Global Ctrl+S keydown listener
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      vscode.postMessage({ type: "save" });
    }
  });

  function saveWebviewState() {
    vscode.setState({
      selectedEnv: state.selectedEnv
    });
  }

  // Synchronize state with Extension Document
  function notifyDocumentChange() {
    const queryObj = {};
    state.queryParams.forEach(item => {
      if (item.enabled && item.key.trim()) {
        queryObj[item.key.trim()] = item.value;
      }
    });

    const headersObj = {};
    state.headersParams.forEach(item => {
      if (item.enabled && item.key.trim()) {
        headersObj[item.key.trim()] = item.value;
      }
    });

    let bodyPayload = null;
    if (state.bodyType === "json") {
      if (state.bodyText.trim()) {
        try {
          bodyPayload = JSON.parse(state.bodyText);
        } catch (e) {
          bodyPayload = state.bodyText;
        }
      } else {
        bodyPayload = "";
      }
    } else if (state.bodyType === "text") {
      bodyPayload = state.bodyText;
    } else if (state.bodyType === "urlencoded") {
      const formObj = {};
      state.formParams.forEach(item => {
        if (item.enabled && item.key.trim()) {
          formObj[item.key.trim()] = item.value;
        }
      });
      bodyPayload = formObj;
    } else if (state.bodyType === "none") {
      bodyPayload = null;
    }

    const payload = {
      name: state.name || "Request",
      method: state.method || "GET",
      url: state.url || "",
      query: queryObj,
      headers: headersObj,
      body: bodyPayload
    };

    vscode.postMessage({
      type: "edit",
      data: payload
    });
  }

  // Sync Content-Type header when urlencoded is selected
  function syncFormUrlEncodedHeader() {
    let contentTypeHeader = state.headersParams.find(h => h.key.trim().toLowerCase() === "content-type");
    if (contentTypeHeader) {
      contentTypeHeader.value = "application/x-www-form-urlencoded";
      contentTypeHeader.enabled = true;
    } else {
      state.headersParams.push({
        id: generateId(),
        key: "Content-Type",
        value: "application/x-www-form-urlencoded",
        enabled: true
      });
    }
    renderKVTable(elHeadersTable, state.headersParams, "header");
    updateBadges();
  }

  // Render Methods
  function renderAll() {
    elName.value = state.name;
    elMethod.value = state.method;
    elMethod.setAttribute("data-method", state.method);
    elUrl.value = state.url;

    renderReqTabs();
    renderKVTable(elQueryTable, state.queryParams, "query");
    renderKVTable(elHeadersTable, state.headersParams, "header");
    renderFormTable();
    updateBadges();
    renderEnvOptions();

    elBodyType.value = state.bodyType;
    renderBodyControls();
    elBodyTextarea.value = state.bodyText;

    renderResponse();
  }

  function renderBodyControls() {
    if (state.bodyType === "none") {
      elBodyTextarea.style.display = "none";
      elFormTable.style.display = "none";
      elBtnFormatBody.style.display = "none";
      elBtnAddFormField.style.display = "none";
    } else if (state.bodyType === "urlencoded") {
      elBodyTextarea.style.display = "none";
      elFormTable.style.display = "block";
      elBtnFormatBody.style.display = "none";
      elBtnAddFormField.style.display = (state.activeReqTab === "body") ? "inline-flex" : "none";
    } else {
      elBodyTextarea.style.display = "block";
      elFormTable.style.display = "none";
      elBtnFormatBody.style.display = state.bodyType === "json" ? "inline-flex" : "none";
      elBtnAddFormField.style.display = "none";
    }
  }

  function renderEnvOptions() {
    elReqEnvSelect.innerHTML = "";
    state.availableEnvs.forEach(envName => {
      const opt = document.createElement("option");
      opt.value = envName;
      opt.textContent = envName;
      if (envName === state.selectedEnv) {
        opt.selected = true;
      }
      elReqEnvSelect.appendChild(opt);
    });
  }

  function renderReqTabs() {
    elTabReqQuery.className = `tab-item ${state.activeReqTab === "query" ? "active" : ""}`;
    elTabReqHeaders.className = `tab-item ${state.activeReqTab === "headers" ? "active" : ""}`;
    elTabReqBody.className = `tab-item ${state.activeReqTab === "body" ? "active" : ""}`;

    elPanelReqQuery.style.display = state.activeReqTab === "query" ? "block" : "none";
    elPanelReqHeaders.style.display = state.activeReqTab === "headers" ? "block" : "none";
    elPanelReqBody.style.display = state.activeReqTab === "body" ? "block" : "none";

    elBtnAddQuery.style.display = state.activeReqTab === "query" ? "inline-flex" : "none";
    elBtnAddHeader.style.display = state.activeReqTab === "headers" ? "inline-flex" : "none";
    elBtnAddFormField.style.display = (state.activeReqTab === "body" && state.bodyType === "urlencoded") ? "inline-flex" : "none";
  }

  function updateBadges() {
    const queryCount = state.queryParams.filter(i => i.enabled && i.key.trim()).length;
    const headersCount = state.headersParams.filter(i => i.enabled && i.key.trim()).length;
    elBadgeQuery.textContent = String(queryCount);
    elBadgeHeaders.textContent = String(headersCount);
  }

  function renderKVTable(container, items, type) {
    container.innerHTML = "";
    if (items.length === 0) {
      const emptyRow = document.createElement("div");
      emptyRow.className = "thoth-empty-state";
      emptyRow.textContent = `No ${type === "query" ? "Query Parameters" : "Headers"} added`;
      container.appendChild(emptyRow);
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "thoth-kv-row";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = item.enabled;
      chk.addEventListener("change", (e) => {
        item.enabled = e.target.checked;
        updateBadges();
        notifyDocumentChange();
      });

      const keyInput = document.createElement("input");
      keyInput.type = "text";
      keyInput.className = "thoth-kv-input";
      keyInput.placeholder = type === "query" ? "Parameter Name" : "Header Name";
      keyInput.value = item.key;
      keyInput.addEventListener("input", (e) => {
        item.key = e.target.value;
        updateBadges();
        notifyDocumentChange();
      });

      const valInput = document.createElement("input");
      valInput.type = "text";
      valInput.className = "thoth-kv-input";
      valInput.placeholder = "Value";
      valInput.value = item.value;
      valInput.addEventListener("input", (e) => {
        item.value = e.target.value;
        notifyDocumentChange();
      });

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn-delete-row";
      btnDelete.title = "Delete Row";
      btnDelete.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
      btnDelete.addEventListener("click", () => {
        items.splice(index, 1);
        renderKVTable(container, items, type);
        updateBadges();
        notifyDocumentChange();
      });

      row.appendChild(chk);
      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(btnDelete);
      container.appendChild(row);
    });
  }

  function renderFormTable() {
    elFormTable.innerHTML = "";
    if (state.formParams.length === 0) {
      const emptyRow = document.createElement("div");
      emptyRow.className = "thoth-empty-state";
      emptyRow.textContent = "No Form Fields added";
      elFormTable.appendChild(emptyRow);
      return;
    }

    state.formParams.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "thoth-kv-row";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = item.enabled;
      chk.addEventListener("change", (e) => {
        item.enabled = e.target.checked;
        notifyDocumentChange();
      });

      const keyInput = document.createElement("input");
      keyInput.type = "text";
      keyInput.className = "thoth-kv-input";
      keyInput.placeholder = "Field Name";
      keyInput.value = item.key;
      keyInput.addEventListener("input", (e) => {
        item.key = e.target.value;
        notifyDocumentChange();
      });

      const valInput = document.createElement("input");
      valInput.type = "text";
      valInput.className = "thoth-kv-input";
      valInput.placeholder = "Value";
      valInput.value = item.value;
      valInput.addEventListener("input", (e) => {
        item.value = e.target.value;
        notifyDocumentChange();
      });

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn-delete-row";
      btnDelete.title = "Delete Field";
      btnDelete.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
      btnDelete.addEventListener("click", () => {
        state.formParams.splice(index, 1);
        renderFormTable();
        notifyDocumentChange();
      });

      row.appendChild(chk);
      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(btnDelete);
      elFormTable.appendChild(row);
    });
  }

  function renderResponse() {
    if (!state.response) {
      elResponseSection.style.display = "none";
      return;
    }

    elResponseSection.style.display = "block";

    // Status Badge
    const status = state.response.status;
    const statusText = state.response.statusText;

    let badgeClass = "badge-status-2xx";
    if (status >= 300 && status < 400) badgeClass = "badge-status-3xx";
    else if (status >= 400 && status < 500) badgeClass = "badge-status-4xx";
    else if (status >= 500 || status === 0) badgeClass = "badge-status-5xx";

    elResponseStatus.className = `badge ${badgeClass}`;
    elResponseStatus.textContent = status > 0 ? `${status} ${statusText}` : `Error: ${statusText}`;

    // Timing Badge
    elResponseTime.textContent = `${state.response.durationMs} ms`;

    // Size Badge
    const sizeKB = (state.response.sizeBytes / 1024).toFixed(2);
    elResponseSize.textContent = `${sizeKB} KB`;

    // Response Tabs
    elTabBody.className = `tab-item ${state.activeTab === "body" ? "active" : ""}`;
    elTabHeaders.className = `tab-item ${state.activeTab === "headers" ? "active" : ""}`;

    if (state.activeTab === "body") {
      if (typeof state.response.body === "object" && state.response.body !== null) {
        elResponseContent.textContent = JSON.stringify(state.response.body, null, 2);
      } else {
        elResponseContent.textContent = state.response.body || "";
      }
    } else {
      const headersArr = Object.entries(state.response.headers || {}).map(([k, v]) => `${k}: ${v}`);
      elResponseContent.textContent = headersArr.join("\n") || "No Response Headers";
    }
  }

  // Event Listeners
  elName.addEventListener("input", (e) => {
    state.name = e.target.value;
    notifyDocumentChange();
  });

  elMethod.addEventListener("change", (e) => {
    state.method = e.target.value;
    elMethod.setAttribute("data-method", state.method);
    notifyDocumentChange();
  });

  elUrl.addEventListener("input", (e) => {
    state.url = e.target.value;
    notifyDocumentChange();
  });

  elReqEnvSelect.addEventListener("change", (e) => {
    state.selectedEnv = e.target.value;
    saveWebviewState();
    vscode.postMessage({
      type: "selectEnv",
      env: state.selectedEnv
    });
  });

  elTabReqQuery.addEventListener("click", () => {
    state.activeReqTab = "query";
    renderReqTabs();
  });

  elTabReqHeaders.addEventListener("click", () => {
    state.activeReqTab = "headers";
    renderReqTabs();
  });

  elTabReqBody.addEventListener("click", () => {
    state.activeReqTab = "body";
    renderReqTabs();
  });

  elBtnAddQuery.addEventListener("click", () => {
    state.queryParams.push({ id: generateId(), key: "", value: "", enabled: true });
    renderKVTable(elQueryTable, state.queryParams, "query");
    updateBadges();
    notifyDocumentChange();
  });

  elBtnAddHeader.addEventListener("click", () => {
    state.headersParams.push({ id: generateId(), key: "", value: "", enabled: true });
    renderKVTable(elHeadersTable, state.headersParams, "header");
    updateBadges();
    notifyDocumentChange();
  });

  elBtnAddFormField.addEventListener("click", () => {
    state.formParams.push({ id: generateId(), key: "", value: "", enabled: true });
    renderFormTable();
    notifyDocumentChange();
  });

  elBodyType.addEventListener("change", (e) => {
    state.bodyType = e.target.value;
    if (state.bodyType === "urlencoded") {
      syncFormUrlEncodedHeader();
    }
    renderBodyControls();
    notifyDocumentChange();
  });

  elBodyTextarea.addEventListener("input", (e) => {
    state.bodyText = e.target.value;
    notifyDocumentChange();
  });

  elBtnFormatBody.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(state.bodyText);
      state.bodyText = JSON.stringify(parsed, null, 2);
      elBodyTextarea.value = state.bodyText;
      notifyDocumentChange();
    } catch (e) {
      // Ignore if invalid JSON
    }
  });

  elBtnSave.addEventListener("click", () => {
    vscode.postMessage({ type: "save" });
  });

  elBtnSend.addEventListener("click", () => {
    if (state.isSending) return;
    state.isSending = true;
    elBtnSend.disabled = true;
    elBtnSend.innerHTML = `<div class="spinner"></div> Sending...`;

    // Construct request data to send to extension
    const queryObj = {};
    state.queryParams.forEach(item => {
      if (item.enabled && item.key.trim()) queryObj[item.key.trim()] = item.value;
    });

    const headersObj = {};
    state.headersParams.forEach(item => {
      if (item.enabled && item.key.trim()) headersObj[item.key.trim()] = item.value;
    });

    let bodyPayload = null;
    if (state.bodyType === "json" && state.bodyText.trim()) {
      try {
        bodyPayload = JSON.parse(state.bodyText);
      } catch (e) {
        bodyPayload = state.bodyText;
      }
    } else if (state.bodyType === "text") {
      bodyPayload = state.bodyText;
    } else if (state.bodyType === "urlencoded") {
      const formObj = {};
      state.formParams.forEach(item => {
        if (item.enabled && item.key.trim()) {
          formObj[item.key.trim()] = item.value;
        }
      });
      bodyPayload = formObj;
    } else if (state.bodyType === "none") {
      bodyPayload = null;
    }

    vscode.postMessage({
      type: "sendRequest",
      selectedEnv: state.selectedEnv,
      request: {
        name: state.name,
        method: state.method,
        url: state.url,
        query: queryObj,
        headers: headersObj,
        body: bodyPayload
      }
    });
  });

  elTabBody.addEventListener("click", () => {
    state.activeTab = "body";
    renderResponse();
  });

  elTabHeaders.addEventListener("click", () => {
    state.activeTab = "headers";
    renderResponse();
  });

  elBtnCopyResponse.addEventListener("click", () => {
    const text = elResponseContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const origText = elBtnCopyResponse.textContent;
      elBtnCopyResponse.textContent = "Copied!";
      setTimeout(() => { elBtnCopyResponse.textContent = origText; }, 1500);
    });
  });

  // Message Handler from Extension Host
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "load": {
        const doc = message.data;
        state.name = doc.name || "Request";
        state.method = doc.method || "GET";
        state.url = doc.url || "";

        // Parse query params to array
        state.queryParams = doc.query ? Object.entries(doc.query).map(([k, v]) => ({
          id: generateId(),
          key: k,
          value: String(v),
          enabled: true
        })) : [];

        // Parse headers to array
        state.headersParams = doc.headers ? Object.entries(doc.headers).map(([k, v]) => ({
          id: generateId(),
          key: k,
          value: String(v),
          enabled: true
        })) : [];

        // Determine bodyType and formParams
        const isUrlEncodedHeader = state.headersParams.some(
          h => h.enabled && h.key.trim().toLowerCase() === "content-type" && h.value.includes("x-www-form-urlencoded")
        );

        if (doc.body === null || doc.body === undefined) {
          state.bodyType = "none";
          state.bodyText = "";
          state.formParams = [];
        } else if (isUrlEncodedHeader || (typeof doc.body === "object" && !Array.isArray(doc.body) && Object.keys(doc.body).length > 0 && !state.bodyText)) {
          if (typeof doc.body === "object" && doc.body !== null) {
            state.bodyType = "urlencoded";
            state.formParams = Object.entries(doc.body).map(([k, v]) => ({
              id: generateId(),
              key: k,
              value: String(v),
              enabled: true
            }));
            state.bodyText = "";
          } else if (typeof doc.body === "string") {
            state.bodyType = "urlencoded";
            try {
              const params = new URLSearchParams(doc.body);
              state.formParams = Array.from(params.entries()).map(([k, v]) => ({
                id: generateId(),
                key: k,
                value: v,
                enabled: true
              }));
            } catch {
              state.formParams = [];
            }
            state.bodyText = "";
          }
        } else if (typeof doc.body === "object") {
          state.bodyType = "json";
          state.bodyText = JSON.stringify(doc.body, null, 2);
          state.formParams = [];
        } else {
          state.bodyType = "text";
          state.bodyText = String(doc.body);
          state.formParams = [];
        }

        renderAll();
        break;
      }

      case "environmentsList": {
        if (Array.isArray(message.environments)) {
          state.availableEnvs = message.environments;
          if (message.selectedEnv && state.availableEnvs.includes(message.selectedEnv)) {
            state.selectedEnv = message.selectedEnv;
          } else if (!state.availableEnvs.includes(state.selectedEnv)) {
            state.selectedEnv = "$shared";
          }
          saveWebviewState();
          renderEnvOptions();
        }
        break;
      }

      case "response": {
        state.isSending = false;
        elBtnSend.disabled = false;
        elBtnSend.innerHTML = `SEND`;
        state.response = message.response;
        renderResponse();
        break;
      }
    }
  });

})();
