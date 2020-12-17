# generator

Create a generator for an Nx Plugin

## Usage

```bash
nx generate generator ...
```

By default, Nx will search for `generator` in the default collection provisioned in `angular.json`.

You can specify the collection explicitly as follows:

```bash
nx g @nrwl/nx-plugin:generator ...
```

Show what will be generated without writing to disk:

```bash
nx g generator ... --dry-run
```

### Examples

Generate libs/my-plugin/src/generators/my-generator:

```bash
nx g generator my-generator --project=my-plugin
```

## Options

### description

Alias(es): d

Type: `string`

Generator description

### name

Type: `string`

Generator name

### project

Alias(es): p

Type: `string`

The name of the project.

### unitTestRunner

Default: `jest`

Type: `string`

Possible values: `jest`, `none`

Test runner to use for unit tests
