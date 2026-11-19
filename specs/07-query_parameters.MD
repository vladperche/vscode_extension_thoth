# Minor adjustments

in the _Editor Screen_, on the tab _Query Parameters_, when there's more than one parameter with the same name, the editor is removing the duplicity.

*Minor correction*
- Change this logic to allow multiple _Query Parameters_ with the same name.
- When the `curl` comand line is built, even if they are repeated
   - example: `curl http://domain.server?id=3&id=5&id=7`
- Allow these multiple parameters to be saved without overwriting (the parameter name is not a _key_)

