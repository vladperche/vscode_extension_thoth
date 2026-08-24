# Variables

Let's talk about **VARIABLES**.
To make all the requests _reusables_, and let them be _configurables_, we need to make it possible to add **variables** inside the requests.

# Storage

The idea is to store all _variables_ and it's corresponding _values_ in a JSON file, but with the `*.thothvars` extension.
Each file, must have the following format:

```
{
    "$shared": {
        "shared_var1": "value1",
        "shared_var2": "value2",
        "shared_varN": "valueN"
    },
    "env_name_1": {
        "env_var1": "env_value1.1",
        "env_var2": "env_value1.2"
    },
    "env_name_2": {
        "env_var1": "env_value2.1",
        "emv_var2": "env_value2.2"
    }
}
```

So, the user can define multiples Environments (eg: Development, Testing, Production, etc), and also, can define a value that can be shared among all the Environments ("$shared").

# Rules

1. Wen the user click on a file with the extension `*.thothvars`, a WebView Editor will be lounched, instead of the standard editor.
2. The WebView Editor, must have a "dropdown option" to the user choose between: **Thoth Variables Editor** or **Standard Editor**.
3. The WebView Editor, should have the following layout:

```
┌────────────────────────────────────────────────────────┐
│ [Environment(dropdown)][v][+][-]                [Save] │
│ ┌────────────────────┬───────────────────────────────┐ │
│ │ Variable           │ Value                     [+] │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ basehost           │ domain.com                [-] │ │
│ │ username           │ jhon.doe                  [-] │ │
│ │ password           │ abc123                    [-] │ │
│ └────────────────────┴───────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

- The [Environment] is a Dropdown, whose the user can select in wich Environment the _variable_ will be added/saved.
- The `$shared` Environment name should be an _default_ option for all files, and it CAN NOT BE **DELETED**.
- When the user click on the [+] button next to the Environment name, a new Environment is created (the name can be typed inside the dropdown).
- When the user click on the [-] button, the current Environment is deleted (please, show a Dialog box to confirm this action).
- When the user click on the [+] button on the top of the grid, a new line is added at the end of the grid.
- When the user click on the [-] button on the end of the row, the selected row is removed (also, show a Dialog box to confirm this action).
- When the user click on the [Save] button or when the user press `ctrl+s`, the file must be saved on the JSON format already explained.

