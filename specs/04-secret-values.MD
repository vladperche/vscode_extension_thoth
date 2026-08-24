# Secret Values

**Secret values**, are identical to _variables_, but must be saved on another file, because they canot be sent to the current `${workspaceFolder}` project Git repository.

Those values are used for environment configurations and are intentionally **workspace-load** and should be stored in `${workspaceFolder}/.vscode/settings.json`.

Do not store these values in the extension's global or user configuration.

Register the `thoth-client.environmentVariables` as an **Thoth Extension** Workspace configuration section, and these will be the JSON format of the section:

```
{
    "thoth-client.environmentVariables": {
        "$shared": {
            "baseUrl": "http://localhost:3000"
        },
        "env_name1": {
            "VAR1": "value1",
            "VAR2": "value2"
        },
        "env_name2": {
            "VAR1": "value3",
            "VAR2": "value4"
        },
        "env_name3": {
            "VAR1": "value5",
            "VAR2": "value6"
        }
    }
}
```

