import {
  chain,
  externalSchematic,
  Rule,
  Tree,
  SchematicContext,
  mergeWith,
  apply,
  url,
  template,
  move,
  noop,
  SchematicsException,
  filter,
} from '@angular-devkit/schematics';
import { join, normalize } from '@angular-devkit/core';
import { Schema } from './schema';

import {
  updateWorkspaceInTree,
  getNpmScope,
  updateJsonInTree,
  formatFiles,
} from '@nrwl/workspace';

import { generateProjectLint, addLintFiles } from '../../utils/lint';
import { addProjectToNxJsonInTree, libsDir } from '../../utils/ast-utils';
import { toJS, updateTsConfigsToJs, maybeJs } from '../../utils/rules/to-js';
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';
import { names, offsetFromRoot } from '@nrwl/devkit';

export interface NormalizedSchema extends Schema {
  name: string;
  fileName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  importPath?: string;
}

function addProject(options: NormalizedSchema): Rule {
  return updateWorkspaceInTree((json) => {
    const architect: { [key: string]: any } = {};

    architect.lint = generateProjectLint(
      normalize(options.projectRoot),
      join(normalize(options.projectRoot), 'tsconfig.lib.json'),
      options.linter,
      [`${options.projectRoot}/**/*.ts`]
    );

    json.projects[options.name] = {
      root: options.projectRoot,
      sourceRoot: join(normalize(options.projectRoot), 'src'),
      projectType: 'library',
      architect,
    };
    return json;
  });
}

function updateTsConfig(options: NormalizedSchema): Rule {
  return (host: Tree) =>
    updateJsonInTree('tsconfig.base.json', (json) => {
      const c = json.compilerOptions;
      c.paths = c.paths || {};
      delete c.paths[options.name];

      if (c.paths[options.importPath]) {
        throw new SchematicsException(
          `You already have a library using the import path "${options.importPath}". Make sure to specify a unique one.`
        );
      }

      c.paths[options.importPath] = [
        maybeJs(
          options,
          `${libsDir(host)}/${options.projectDirectory}/src/index.ts`
        ),
      ];

      return json;
    });
}

function createFiles(options: NormalizedSchema): Rule {
  const { className, name, propertyName } = names(options.name);

  return mergeWith(
    apply(url(`./files/lib`), [
      template({
        ...options,
        className,
        name,
        propertyName,
        cliCommand: 'nx',
        tmpl: '',
        offsetFromRoot: offsetFromRoot(options.projectRoot),
        hasUnitTestRunner: options.unitTestRunner !== 'none',
      }),
      move(options.projectRoot),
      addTestFiles(options),
      options.js ? toJS() : noop(),
    ])
  );
}

function updateNxJson(options: NormalizedSchema): Rule {
  return addProjectToNxJsonInTree(options.name, { tags: options.parsedTags });
}

function addJest(options: NormalizedSchema) {
  return options.unitTestRunner !== 'none'
    ? externalSchematic('@nrwl/jest', 'jest-project', {
        project: options.name,
        setupFile: 'none',
        supportTsx: true,
        babelJest: options.babelJest,
        skipSerializers: true,
        testEnvironment: options.testEnvironment,
      })
    : noop();
}

export default function (schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const options = normalizeOptions(host, schema);

    return chain([
      addLintFiles(options.projectRoot, options.linter),
      createFiles(options),
      options.js ? updateTsConfigsToJs(options) : noop(),
      !options.skipTsConfig ? updateTsConfig(options) : noop(),
      addProject(options),
      updateNxJson(options),
      addJest(options),
      formatFiles(options),
    ])(host, context);
  };
}

export const libraryGenerator = wrapAngularDevkitSchematic(
  '@nrwl/workspace',
  'library'
);

function normalizeOptions(host: Tree, options: Schema): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;

  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const fileName = getCaseAwareFileName({
    fileName: options.simpleModuleName ? name : projectName,
    pascalCaseFiles: options.pascalCaseFiles,
  });

  const projectRoot = `${libsDir(host)}/${projectDirectory}`;

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const defaultImportPath = `@${getNpmScope(host)}/${projectDirectory}`;
  const importPath = options.importPath || defaultImportPath;

  return {
    ...options,
    fileName,
    name: projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    importPath,
  };
}

function getCaseAwareFileName(options: {
  pascalCaseFiles: boolean;
  fileName: string;
}) {
  const normalized = names(options.fileName);

  return options.pascalCaseFiles ? normalized.className : normalized.fileName;
}

function addTestFiles(options: Pick<Schema, 'unitTestRunner'>) {
  return options.unitTestRunner === 'none'
    ? filter((path) => !(path.endsWith('spec.ts') || path.endsWith('spec.tsx')))
    : noop();
}
