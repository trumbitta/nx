import {
  checkFilesExist,
  newProject,
  readFile,
  runCLI,
  tmpProjPath,
  uniq,
} from '@nrwl/e2e/utils';
import { writeFileSync } from 'fs';

describe('Storybook schematics', () => {
  describe('build storybook', () => {
    it('should build a React based storybook', () => {
      newProject();

      const reactStorybookLib = uniq('test-ui-lib-react');
      runCLI(`generate @nrwl/react:lib ${reactStorybookLib} --no-interactive`);
      runCLI(
        `generate @nrwl/react:storybook-configuration ${reactStorybookLib} --generateStories --no-interactive`
      );

      // build React lib
      runCLI(`run ${reactStorybookLib}:build-storybook`);
      checkFilesExist(`dist/storybook/${reactStorybookLib}/index.html`);
      expect(
        readFile(`dist/storybook/${reactStorybookLib}/index.html`)
      ).toContain(`<title>Storybook</title>`);
    }, 1000000);

    it('should build a React based storybook that references another lib', () => {
      newProject();

      const reactStorybookLib = uniq('test-ui-lib-react');
      runCLI(`generate @nrwl/react:lib ${reactStorybookLib} --no-interactive`);
      runCLI(
        `generate @nrwl/react:storybook-configuration ${reactStorybookLib} --generateStories --no-interactive`
      );

      const anotherReactLib = uniq('test-another-lib-react');
      runCLI(`generate @nrwl/react:lib ${anotherReactLib} --no-interactive`);
      // create a React component we can reference
      writeFileSync(
        tmpProjPath(`libs/${anotherReactLib}/src/lib/mytestcmp.tsx`),
        `
            import React from 'react';
            
            /* eslint-disable-next-line */
            export interface MyTestCmpProps {}
            
            export const MyTestCmp = (props: MyTestCmpProps) => {
              return (
                <div>
                  <h1>Welcome to test cmp!</h1>
                </div>
              );
            };
            
            export default MyTestCmp;
        `
      );
      // update index.ts and export it
      writeFileSync(
        tmpProjPath(`libs/${anotherReactLib}/src/index.ts`),
        `
            export * from './lib/mytestcmp';
        `
      );

      // create a story in the first lib to reference the cmp from the 2nd lib
      writeFileSync(
        tmpProjPath(
          `libs/${reactStorybookLib}/src/lib/myteststory.stories.tsx`
        ),
        `
            import React from 'react';
            
            import { MyTestCmp, MyTestCmpProps } from '@proj/${anotherReactLib}';
    
            export default {
              component: MyTestCmp,
              title: 'MyTestCmp',
            };
    
            export const primary = () => {
              /* eslint-disable-next-line */
              const props: MyTestCmpProps = {};
    
              return <MyTestCmp />;
            };
        `
      );

      // build React lib
      runCLI(`run ${reactStorybookLib}:build-storybook`);
      checkFilesExist(`dist/storybook/${reactStorybookLib}/index.html`);
      expect(
        readFile(`dist/storybook/${reactStorybookLib}/index.html`)
      ).toContain(`<title>Storybook</title>`);
    }, 1000000);
  });
});

export function createTestUILib(libName: string): void {
  runCLI(`g @nrwl/angular:library ${libName} --no-interactive`);
  runCLI(
    `g @nrwl/angular:component test-button --project=${libName} --no-interactive`
  );

  writeFileSync(
    tmpProjPath(`libs/${libName}/src/lib/test-button/test-button.component.ts`),
    `
      import { Component, OnInit, Input } from '@angular/core';

      export type ButtonStyle = 'default' | 'primary' | 'accent';

      @Component({
        selector: 'proj-test-button',
        templateUrl: './test-button.component.html',
        styleUrls: ['./test-button.component.css']
      })
      export class TestButtonComponent implements OnInit {
        @Input('buttonType') type = 'button';
        @Input() style: ButtonStyle = 'default';
        @Input() age: number;
        @Input() isDisabled = false;

        constructor() { }

        ngOnInit() {
        }

      }
      `
  );

  writeFileSync(
    tmpProjPath(
      `libs/${libName}/src/lib/test-button/test-button.component.html`
    ),
    `
    <button [disabled]="isDisabled" [attr.type]="type" [ngClass]="style">Click me</button>
    <p>You are {{age}} years old.</p>
    `
  );
  runCLI(
    `g @nrwl/angular:component test-other --project=${libName} --no-interactive`
  );
}
