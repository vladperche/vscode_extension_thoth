(function () {
  const vscode = acquireVsCodeApi();

  // State
  let state = {
    data: { "$shared": {} },
    activeEnv: "$shared"
  };

  // DOM Elements
  const elEnvSelect = document.getElementById("env-select");
  const elBtnAddEnv = document.getElementById("btn-add-env");
  const elBtnDelEnv = document.getElementById("btn-del-env");
  const elBtnSave = document.getElementById("btn-save");
  const elBtnAddVar = document.getElementById("btn-add-var");
  const elVarsTableBody = document.getElementById("vars-table-body");
  const elEnvNameLabel = document.getElementById("env-name-label");

  // Modal Elements
  const elModal = document.getElementById("env-modal");
  const elModalInput = document.getElementById("env-modal-input");
  const elModalCancel = document.getElementById("env-modal-cancel");
  const elModalConfirm = document.getElementById("env-modal-confirm");

  // Global Ctrl+S keydown listener
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      e.stopPropagation();
      vscode.postMessage({ type: "save" });
    }
  });

  function notifyDocumentChange() {
    vscode.postMessage({
      type: "edit",
      data: state.data
    });
  }

  function renderAll() {
    renderEnvSelect();
    renderTable();
  }

  function renderEnvSelect() {
    elEnvSelect.innerHTML = "";
    const envs = Object.keys(state.data);
    if (!envs.includes("$shared")) {
      envs.unshift("$shared");
    }

    envs.forEach(envName => {
      const opt = document.createElement("option");
      opt.value = envName;
      opt.textContent = envName;
      if (envName === state.activeEnv) {
        opt.selected = true;
      }
      elEnvSelect.appendChild(opt);
    });

    elBtnDelEnv.disabled = (state.activeEnv === "$shared");
    elEnvNameLabel.textContent = state.activeEnv;
  }

  function renderTable() {
    elVarsTableBody.innerHTML = "";
    const currentVars = state.data[state.activeEnv] || {};
    const entries = Object.entries(currentVars);

    if (entries.length === 0) {
      const emptyRow = document.createElement("div");
      emptyRow.className = "thoth-empty-state";
      emptyRow.textContent = `No variables in environment '${state.activeEnv}'`;
      elVarsTableBody.appendChild(emptyRow);
      return;
    }

    entries.forEach(([key, value], index) => {
      const row = document.createElement("div");
      row.className = "thoth-kv-row";

      const keyInput = document.createElement("input");
      keyInput.type = "text";
      keyInput.className = "thoth-kv-input var-key";
      keyInput.placeholder = "Variable Name";
      keyInput.value = key;

      const valInput = document.createElement("input");
      valInput.type = "text";
      valInput.className = "thoth-kv-input var-val";
      valInput.placeholder = "Value";
      valInput.value = value;

      // Handle Key changes
      keyInput.addEventListener("change", (e) => {
        const newKey = e.target.value.trim();
        if (newKey === key) return;

        delete currentVars[key];
        if (newKey) {
          currentVars[newKey] = valInput.value;
        }
        notifyDocumentChange();
        renderTable();
      });

      // Handle Value changes
      valInput.addEventListener("input", (e) => {
        const currentKey = keyInput.value.trim();
        if (currentKey) {
          currentVars[currentKey] = e.target.value;
          notifyDocumentChange();
        }
      });

      const btnDelete = document.createElement("button");
      btnDelete.className = "btn-delete-row";
      btnDelete.title = "Delete Variable";
      btnDelete.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
      btnDelete.addEventListener("click", () => {
        vscode.postMessage({
          type: "requestDeleteVar",
          env: state.activeEnv,
          key: key
        });
      });

      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(btnDelete);
      elVarsTableBody.appendChild(row);
    });
  }

  // Event Listeners
  elEnvSelect.addEventListener("change", (e) => {
    state.activeEnv = e.target.value;
    renderAll();
  });

  elBtnAddEnv.addEventListener("click", () => {
    elModalInput.value = "";
    elModal.style.display = "flex";
    elModalInput.focus();
  });

  elModalCancel.addEventListener("click", () => {
    elModal.style.display = "none";
  });

  elModalConfirm.addEventListener("click", () => {
    const envName = elModalInput.value.trim();
    if (!envName) return;

    if (!state.data[envName]) {
      state.data[envName] = {};
      state.activeEnv = envName;
      notifyDocumentChange();
      renderAll();
    }
    elModal.style.display = "none";
  });

  elBtnDelEnv.addEventListener("click", () => {
    if (state.activeEnv === "$shared") return;
    vscode.postMessage({
      type: "requestDeleteEnv",
      env: state.activeEnv
    });
  });

  elBtnAddVar.addEventListener("click", () => {
    if (!state.data[state.activeEnv]) {
      state.data[state.activeEnv] = {};
    }
    const currentVars = state.data[state.activeEnv];
    let newKey = "new_var";
    let counter = 1;
    while (currentVars[newKey]) {
      newKey = `new_var_${counter++}`;
    }
    currentVars[newKey] = "";
    notifyDocumentChange();
    renderTable();
  });

  elBtnSave.addEventListener("click", () => {
    vscode.postMessage({ type: "save" });
  });

  // Message Handler from Extension Host
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "load": {
        state.data = message.data || { "$shared": {} };
        if (!state.data[state.activeEnv]) {
          state.activeEnv = "$shared";
        }
        renderAll();
        break;
      }

      case "confirmDeleteEnvResult": {
        if (message.confirmed && message.env) {
          delete state.data[message.env];
          state.activeEnv = "$shared";
          notifyDocumentChange();
          renderAll();
        }
        break;
      }

      case "confirmDeleteVarResult": {
        if (message.confirmed && message.env && message.key) {
          if (state.data[message.env]) {
            delete state.data[message.env][message.key];
            notifyDocumentChange();
            renderTable();
          }
        }
        break;
      }
    }
  });

})();
