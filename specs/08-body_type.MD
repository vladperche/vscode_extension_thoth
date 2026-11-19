#Minor _bug_
When the file `*.thoth` is saved in the _WebView Editor_, the **Body Type** field is not present on the corresponding file.

#Minor adjustments
In the _WebView Editor_:

- If the user selects the **Body type** option `Text / Raw`, lookup in the **Headers**, if there's an option with `Content-Type`, change the value to `text/plain`, if it doesn't exists, add the corresponding header/value.
- When the user click on the **Send** button, if the **Body type** was set to `Text / Raw`, the text must be sent on the request body.

- If the user selects the **Body type** option `JSON`, lookup in the **Headers**, if there's an option with `Content-Type`, change the value to `application/json`, if it doesn't exists, add the corresponding header/value.
- When the user click on the **Send** button, if the **Body type** was set to `JSON`, the JSON must be sent as a string on the request body.

- If the user selects the **Body type** option `x-www-form-urlencoded`, lookup in the **Headers**, if there's an option with `Content-Type`, change the value to `x-www-form-urlencoded`, if it doesn't exists, add the corresponding header/value.
- When the user click on the **Send** button, if the **Body type** was set to `x-www-form-urlencoded`, the body must be the field/values on the grid encoded to these respective format.

