# Thoth - HTTP Request Client for Visual Studio Code

![Thoth Icon](resources/icon.png)

**Thoth** is a powerful, visual HTTP Request Client extension for Visual Studio Code. It allows developers to create, configure, execute, save, and share HTTP requests directly inside their codebase using custom `*.thoth` files and environment variable management with `*.thothvars` files.

---

## Features

- **Visual Webview Editor (`*.thoth`)**: Click any `.thoth` file in the VS Code Explorer to launch a rich HTTP client interface.
- **Full HTTP Method Support**: Execute `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, and `OPTIONS` requests.
- **Tabbed Request Configuration**:
  - **Query Parameters**: Dynamic key-value pair grid with toggle checkboxes and row deletion.
  - **Headers**: Dynamic key-value header configuration.
  - **Body Editor**: Format selection (`JSON`, `Text / Raw`, `None`) with built-in JSON pretty-printing.
- **Show cURL View**: Toggle between the visual editor and a read-only `cURL` command view with a **[Copy cURL]** button via VS Code's editor mode dropdown.
- **Thoth Variables (`*.thothvars`)**: Manage environment variables across multiple environments (e.g. `Development`, `Testing`, `Production`) and shared variables (`$shared`).
- **Workspace Secrets**: Configure secret environment variables in `${workspaceFolder}/.vscode/settings.json` (`thoth-client.environmentVariables`) to keep passwords and API keys out of Git.
- **Hierarchical Variable Resolution**: Use `{{variable_name}}` in URLs, Query Parameters, Headers, or Bodies. Variables resolve dynamically from local folder `*.thothvars` up to `${workspaceFolder}` with fallback to workspace settings.
- **Keyboard Shortcuts**: Native `Ctrl+S` / `Cmd+S` saving support.

---

## File Specifications

### 1. Request Files (`*.thoth`)

To create your first request, just create a file with the `*.thoth` extension, and when the file is opened, the **Thoth Editor** will be activated:
![Simple request example](resources/screen-01-sample.png)

Just select the Method, insert the **URL** and/or the parameters, or the **Body**, and click on the **Send** button.

Requests are stored in clean JSON format:
```json
{
    "name": "Login Request",
    "method": "POST",
    "url": "https://api.example.com/login",
    "query": {
        "redirect_to": "/home"
    },
    "headers": {
        "Content-Type": "application/json"
    },
    "body": {
        "key": "value"
    }
}
```

### 2. Variable Files (`*.thothvars`)

Variables are a collections of values that can be reused acrros your requests.
To create a variable, first create a file with the `*.thothvars` extension.
When the file is opened, the **Thoth Vars Editor** will be showed:
![Thoth Vars Editor](resources/screen-02-variables.png)

Variables are grouped by Environment, so you can manage the same request and reuse it on each environment with diferent values.
The `$shared` Environment is used when you want to have a variable that have the same value on all Environments.

Variable collections are stored in structured JSON grouped by environments blocks:

```json
{
    "$shared": {
        "base_url": "api.example.com"
    },
    "Development": {
        "username": "dev.user",
        "password": "dev.password"
    },
    "Production": {
        "username": "prod.user",
        "password": "prod.password"
    }
}
```

**Security tips**
DO NOT use the _variable_ files to save SECRETS, for example: passwords, key or tokens.

### 3. Workspace Secrets (`.vscode/settings.json`)

To keep sensitive keys out of source control, store workspace secrets in `.vscode/settings.json`:

```json
{
    "thoth-client.environmentVariables": {
        "$shared": {
            "api_key": "secret-12345"
        },
        "Development": {
            "db_password": "local-db-pass"
        }
    }
}
```

**Security tips**
REMEMBER to ALWAYS include `.vscode` in your `gitignore` file to avoid **sensitive data** to be stored in your **repository**.

### 4 Using variables and secrets

To use _variables_ OR _secrets_ inside your request, just open the request, and type the _variable name_ in any part of your request, envolvig it on a _double curly braces_, example:
![Variables usage](resources/screen-03-variables_usage.png)

When you click **SEND** or view **Show cURL**, Thoth resolves `{{variable_name}}` placeholders using the following cascade:

1. **Folder Hierarchy**: Traverses folders starting from the current `.thoth` file's directory up to `${workspaceFolder}` looking for `*.thothvars` files.
2. **Environment & $shared**: Checks the selected Environment section first, followed by `$shared`.
3. **Conflict Detection**: If multiple `*.thothvars` files in the same folder define the same variable name, execution aborts with a conflict error.
4. **Workspace Secrets**: If not found in `*.thothvars`, searches `.vscode/settings.json` under `thoth-client.environmentVariables`.
5. **Execution Instance Only**: Variable values are substituted in memory at runtime without modifying your `.thoth` files on disk.

---

## Commands

- `Thoth: Create New HTTP Request` (`thoth.newRequest`): Creates a new `.thoth` HTTP request file.

---

## License

MIT License.
