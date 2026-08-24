# Variables usage

In the `*.thoth` _WebView Editor_, the user can refer to any variable, embracing them in a "double curly braces".
These symbols can be used in any part of the request (in the URL, query parameters values, headers or inside the body content).

# Layout changes

In the `*.thoth` _WebView Editor_, in the same line/row of the `[Send]` button, add a dropdow (selectable, but not editable) with all the Environment names:

```
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [Environment(dropdown)][v]            [ SEND ]         │
├─────────────────────────────────────────────────────────┤
```

The Environment names list should be loaded from the following rules:
- In the same path/folder of the current `*.thoth` file, search for all `*.thothvars` files and it's respective Environment names.
- If the current `*.thoth` file is in a sub-folder of the `${workspaceFolder}`, go to the parent level of this sub-folder
- Search for all `*.thothvars` files
- If the name of the Environmnet already exists, ignore it.
- If the name of the Environment doesn't exists, add it to the dropdown.
- Repeat the process until get to the `${workspaceFolder}`
- DO NOT go further to the `${workspaceFolder}`'s parent path

**Example:**
URL: 
    https://{{basehost}}/api/users

When the user click on the `[Send]` button, before the execution of the request, all the _variables_ must be replaced by their values (only on the execution instance).
To retrieve the _variable_ value, you must follow the following rules:

1. First, locate in the same folder of the `*.thoth` file for `*.thothvars` files.
2. In each `*.thothvars` file, locate the same _Environment_ the user has already selected in the dowpdown.
3. If there's more than one `*.thothvars` in the same folder AND the _variable name_ are defined more than once, show a warning/error message, and **STOP** the request.
4. If the _variable name_ is found, fetch the _value_, and restart the steps with the next variable.
5. If _variable name_ is not found on the `*.thothvars` of the current `* .thoth` file are in a sub-folder of the `${workspaceFolder}`, go to the parent level of this sub-folder, until you reach the `${workspaceFolder}` (please DO NOT go further to the `${workspaceFolder}`'s parent path).
6. Repeat the process from step 2, until the variable name is found, or the `${workspaceFolder}` is reached.
7. If the _variable name_ was not found in any `*.thothvars` files, search the _variable name_ in the `.vscode/settings.json` file, on the `thoth-client.environmentVariables` section.
8. If the _variable name_ was not found in any `*.thothvars` files NOR in the `settings.json` section, show a WARNING/ERROR message, and **STOP** the request.
9. If the _variable name_ was found, proceed the request, replacing the `{{variable_name}}` with the `{{variable_value}}` on the EXECUTION INSTANCE (the values in the files MUST NOT BE CHANGED).

