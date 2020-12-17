import { Tree } from '@angular-devkit/schematics';
import { normalize } from '@angular-devkit/core';
import { appsDir } from '@nrwl/workspace/src/utils/ast-utils';
import { NormalizedSchema, Schema } from '../schema';
import { assertValidStyle } from '../../../utils/assertion';
import { names } from '@nrwl/devkit';

export function normalizeOptions(
  host: Tree,
  options: Schema
): NormalizedSchema {
  const appDirectory = options.directory
    ? `${names(options.directory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
  const e2eProjectName = `${appProjectName}-e2e`;

  const appProjectRoot = normalize(`${appsDir(host)}/${appDirectory}`);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const fileName = options.pascalCaseFiles ? 'App' : 'app';

  const styledModule = /^(css|scss|less|styl|none)$/.test(options.style)
    ? null
    : options.style;

  assertValidStyle(options.style);

  return {
    ...options,
    name: names(options.name).fileName,
    projectName: appProjectName,
    appProjectRoot,
    e2eProjectName,
    parsedTags,
    fileName,
    styledModule,
    hasStyles: options.style !== 'none',
  };
}
