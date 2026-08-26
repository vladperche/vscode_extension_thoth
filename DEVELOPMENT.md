
# Requiriments

- Visual Studio Code
- node & npm (for development and testing)
- VSCE (to publish)

# Publishing

## Instal VSCE

```
npm install -g @vscode/vsce
```

## Login to VSCE

```
npx vsce login <your-publisher-id>
```

### Package

```
npx vsce package
```

### Publish

To release your first version, just run:
```
npx vsce publish
```

To release future updates, change the `version` inside the `package.json`, and run:
```
npx vsce publish
```

Or, to have automatically update the version in `package.json` run:

- Patch update (0.4.0 → 0.4.1): `npx vsce publish patch`
- Minor feature update (0.4.0 → 0.5.0): `npx vsce publish minor`
- Major version update (0.4.0 → 1.0.0): `npx vsce publish major`

Once published, your extension will be live on the VS Code Marketplace within a few minutes!
