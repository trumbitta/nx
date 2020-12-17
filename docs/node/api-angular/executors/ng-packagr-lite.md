# ng-packagr-lite

Build an Angular library for incremental building

Properties can be configured in workspace.json when defining the executor, or when invoking it.
Read more about how to use executors and the CLI here: https://nx.dev/node/guides/cli.

## Properties

### project

Type: `string`

The file path for the ng-packagr configuration file, relative to the current workspace.

### tsConfig

Type: `string`

The full path for the TypeScript configuration file, relative to the current workspace.

### updateBuildableProjectDepsInPackageJson

Default: `true`

Type: `boolean`

Update buildable project dependencies in package.json

### watch

Default: `false`

Type: `boolean`

Run build when files change.
