# Main porpouse

Create a **Visual Studio Code** _Extension_, named **Thoth**. Use the `resources/icon.png` as a Extension Icon.
The main function of this extension, will be to handle HTTP requests, letting the user to create and configure those requests, save them, and share within the source code.

# Functionality

The extension must handle files with the extension `*.thoth`.
When a file with these extension are clicked on the _Explorer_ window, instead of the standard editor, must show a _WebView_ to handle the HTTP Request (one per file).

Basicaly, the `*.thoth` file must be saved in the JSON format, for example:

```
{
    "name": "Login",
    "method": "POST",
    "url": "https://api.example.com/login",
    "query": {
        "redirect_to": "/home",
        "keep_logged": true
    },
    "headers": {
        "Content-Type": "application/json"
    },
    "body": {
        //Body can by a JSON or a TEXT value
    }
}
```

# Webview Layout

So, when the user clicks on a `*.thoth` file, VSCode must show something like:

```
┌─────────────────────────────────────────────────────────┐
│ Login                                            [Save] │
├───────────────┬─────────────────────────────────────────┤
│ Method        │ POST                                    │
│ URL           │ https://api.example.com/login           │
├───────────────┴─────────────────────────────────────────┤
│ Query                                                   │
│ ┌────────────────────┬───────────────────────────────┐  │
│ │ redirect_to        │ /home                         │  │
│ │ keep_logged        │ true                          │  │
│ └────────────────────┴───────────────────────────────┘  │
│ Headers                                                 │
│ ┌────────────────────┬───────────────────────────────┐  │
│ │ Content-Type       │ application/json              │  │
│ └────────────────────┴───────────────────────────────┘  │
│                                                         │
│ Body                                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ {                                                   │ │
│ │   "username": "{{username}}",                       │ │
│ │   "password": "{{password}}"                        │ │
│ │ }                                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│                    [ SEND ]                             │
├─────────────────────────────────────────────────────────┤
│ Response                                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 200 OK     142 ms                                   │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                     │ │
│ │ {                                                   │ │
│ │   "token": "...",                                   │ │
│ │   "user": {...}                                     │ │
│ │ }                                                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- When the user click on the `[Save]` button, the selected file must be saved with the JSON format.
- When the user click on the `[Send]` button, the request must be executed

