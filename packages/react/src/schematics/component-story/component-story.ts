import {
  applyTemplates,
  chain,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { join, normalize } from '@angular-devkit/core';
import { formatFiles, getProjectConfig } from '@nrwl/workspace';
import { applyWithSkipExisting } from '@nrwl/workspace/src/utils/ast-utils';
import * as ts from 'typescript';
import {
  getComponentName,
  getComponentPropsInterface,
} from '../../utils/ast-utils';
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';

export interface CreateComponentStoriesFileSchema {
  project: string;
  componentPath: string;
}

export type KnobType = 'text' | 'boolean' | 'number' | 'select';

// TODO: candidate to refactor with the angular component story
export function getKnobDefaultValue(property: ts.SyntaxKind): string {
  const typeNameToDefault: Record<number, any> = {
    [ts.SyntaxKind.StringKeyword]: "''",
    [ts.SyntaxKind.NumberKeyword]: 0,
    [ts.SyntaxKind.BooleanKeyword]: false,
  };

  const resolvedValue = typeNameToDefault[property];
  if (typeof resolvedValue === undefined) {
    return "''";
  } else {
    return resolvedValue;
  }
}

export function createComponentStoriesFile({
  // name,
  project,
  componentPath,
}: CreateComponentStoriesFileSchema): Rule {
  return (tree: Tree, context: SchematicContext): Rule => {
    const proj = getProjectConfig(tree, project);
    const sourceRoot = proj.sourceRoot;
    // TODO: Remove this entirely, given we don't support TSLint with React?
    const usesEsLint = true;

    const componentFilePath = normalize(join(sourceRoot, componentPath));
    const componentDirectory = componentFilePath.replace(
      componentFilePath.slice(componentFilePath.lastIndexOf('/')),
      ''
    );

    const isPlainJs = componentFilePath.endsWith('.jsx');
    let fileExt = 'tsx';
    if (componentFilePath.endsWith('.jsx')) {
      fileExt = 'jsx';
    } else if (componentFilePath.endsWith('.js')) {
      fileExt = 'js';
    }

    const componentFileName = componentFilePath
      .slice(componentFilePath.lastIndexOf('/') + 1)
      .replace('.tsx', '')
      .replace('.jsx', '')
      .replace('.js', '');

    const name = componentFileName;

    const contents = tree.read(componentFilePath);
    if (!contents) {
      throw new SchematicsException(`Failed to read ${componentFilePath}`);
    }

    const sourceFile = ts.createSourceFile(
      componentFilePath,
      contents.toString(),
      ts.ScriptTarget.Latest,
      true
    );

    const cmpDeclaration = getComponentName(sourceFile);

    if (!cmpDeclaration) {
      throw new SchematicsException(
        `Could not find any React component in file ${componentFilePath}`
      );
    }

    const propsInterface = getComponentPropsInterface(sourceFile);

    let propsTypeName: string = null;
    let props: {
      name: string;
      type: KnobType;
      defaultValue: any;
    }[] = [];

    if (propsInterface) {
      propsTypeName = propsInterface.name.text;

      props = propsInterface.members.map((member: ts.PropertySignature) => {
        const initializerKindToKnobType: Record<number, KnobType> = {
          [ts.SyntaxKind.StringKeyword]: 'text',
          [ts.SyntaxKind.NumberKeyword]: 'number',
          [ts.SyntaxKind.BooleanKeyword]: 'boolean',
        };

        return {
          name: (member.name as ts.Identifier).text,
          type: initializerKindToKnobType[member.type.kind],
          defaultValue: getKnobDefaultValue(member.type.kind),
        };
      });
    }

    return chain([
      applyWithSkipExisting(url('./files'), [
        applyTemplates({
          componentFileName: name,
          propsTypeName,
          props,
          usedKnobs: props.map((x) => x.type).join(', '),
          componentName: (cmpDeclaration as any).name.text,
          isPlainJs,
          fileExt,
          usesEsLint,
        }),
        move(normalize(componentDirectory)),
      ]),
    ]);
  };
}

export default function (schema: CreateComponentStoriesFileSchema): Rule {
  return chain([createComponentStoriesFile(schema), formatFiles()]);
}

export const componentStoryGenerator = wrapAngularDevkitSchematic(
  '@nrwl/react',
  'component-story'
);
