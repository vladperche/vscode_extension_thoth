# Layout adjustments

- In the `*.thoth` _WebView Editor_
    - Remove the _brackets_ in the **Send** button
    - Move the **Body** inside the **Tab group** with the Query Parameters and Headers

# New feature

- In the `*.thoth` _WebView Editor_
    - In the **Body type** _dropdown_ add the option: `x-www-form-urlencoded`
    - If the user selects these option, change the _Body field_ to a grid, like the **Header**

Example:

│ Body                                                    │
│ ┌────────────────────┬───────────────────────────────┐  │
│ │ field              │ value                         │  │
│ │ field              │ value                         │  │
│ │ field              │ value                         │  │
│ │ field              │ value                         │  │
│ └────────────────────┴───────────────────────────────┘  │

    - If the user selects these option, lookup in the **Headers**, if there's an option with `Content-Type`, change the value to `x-www-form-urlencoded`, if it doesn't exists, add the corresponding header/value.
    - When the user click on the **Send** button, if the **Body type** was set to `x-www-form-urlencoded`, the body must be the field/values on the grid encoded to these respective format.

