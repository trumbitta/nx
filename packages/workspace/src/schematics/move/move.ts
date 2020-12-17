import { chain, Rule } from '@angular-devkit/schematics';
import { checkProjectExists } from '../../utils/rules/check-project-exists';
import { checkDestination } from './lib/check-destination';
import { moveProject } from './lib/move-project';
import { updateCypressJson } from './lib/update-cypress-json';
import { updateImports } from './lib/update-imports';
import { updateJestConfig } from './lib/update-jest-config';
import { updateNxJson } from './lib/update-nx-json';
import { updateProjectRootFiles } from './lib/update-project-root-files';
import { updateWorkspace } from './lib/update-workspace';
import { Schema } from './schema';
import { wrapAngularDevkitSchematic } from '@nrwl/devkit/ngcli-adapter';

export default function (schema: Schema): Rule {
  return chain([
    checkProjectExists(schema),
    checkDestination(schema),
    moveProject(schema), // we MUST move the project first, if we don't we get a "This should never happen" error 🤦‍♀️
    updateProjectRootFiles(schema),
    updateCypressJson(schema),
    updateJestConfig(schema),
    updateNxJson(schema),
    updateImports(schema),
    updateWorkspace(schema), // Have to do this last because all previous rules need the information in here
  ]);
}

export const moveGenerator = wrapAngularDevkitSchematic(
  '@nrwl/workspace',
  'move'
);
