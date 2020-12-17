import {
  checkFilesExist,
  expectTestsPass,
  newProject,
  readJson,
  runCLI,
  runCLIAsync,
  uniq,
  workspaceConfigName,
} from '@nrwl/e2e/utils';

describe('Nx Plugin', () => {
  it('should be able to generate a Nx Plugin ', async (done) => {
    newProject();
    const plugin = uniq('plugin');

    runCLI(
      `generate @nrwl/nx-plugin:plugin ${plugin} --linter=eslint --importPath=@proj/${plugin}`
    );
    const lintResults = runCLI(`lint ${plugin}`);
    expect(lintResults).toContain('All files pass linting.');

    expectTestsPass(await runCLIAsync(`test ${plugin}`));

    const buildResults = runCLI(`build ${plugin}`);
    expect(buildResults).toContain('Done compiling TypeScript files');
    checkFilesExist(
      `dist/libs/${plugin}/package.json`,
      `dist/libs/${plugin}/generators.json`,
      `dist/libs/${plugin}/executors.json`,
      `dist/libs/${plugin}/src/index.js`,
      `dist/libs/${plugin}/src/generators/${plugin}/schema.json`,
      `dist/libs/${plugin}/src/generators/${plugin}/schema.d.ts`,
      `dist/libs/${plugin}/src/generators/${plugin}/generator.js`,
      `dist/libs/${plugin}/src/generators/${plugin}/files/src/index.ts__template__`,
      `dist/libs/${plugin}/src/executors/build/executor.js`,
      `dist/libs/${plugin}/src/executors/build/schema.d.ts`,
      `dist/libs/${plugin}/src/executors/build/schema.json`
    );
    const nxJson = readJson('nx.json');
    expect(nxJson).toMatchObject({
      projects: expect.objectContaining({
        [plugin]: {
          tags: [],
        },
        [`${plugin}-e2e`]: {
          tags: [],
          implicitDependencies: [`${plugin}`],
        },
      }),
    });
    done();
  }, 45000);

  // the test invoke ensureNxProject, which points to @nrwl/workspace collection
  // which walks up the directory to find it in the next repo itself, so it
  // doesn't use the collection we are building
  // we should change it to point to the right collection using relative path
  it(`should run the plugin's e2e tests`, async (done) => {
    newProject();
    const plugin = uniq('plugin-name');
    runCLI(
      `generate @nrwl/nx-plugin:plugin ${plugin} --linter=eslint --importPath=@proj/${plugin}`
    );
    const results = await runCLIAsync(`e2e ${plugin}-e2e`);
    expect(results.stdout).toContain('Compiling TypeScript files');
    expectTestsPass(results);

    done();
  }, 250000);

  it('should be able to generate a migration', async (done) => {
    newProject();
    const plugin = uniq('plugin');
    const version = '1.0.0';

    runCLI(
      `generate @nrwl/nx-plugin:plugin ${plugin} --linter=eslint --importPath=@proj/${plugin}`
    );
    runCLI(
      `generate @nrwl/nx-plugin:migration --project=${plugin} --version=${version} --packageJsonUpdates=false`
    );

    const lintResults = runCLI(`lint ${plugin}`);
    expect(lintResults).toContain('All files pass linting.');

    expectTestsPass(await runCLIAsync(`test ${plugin}`));

    const buildResults = runCLI(`build ${plugin}`);
    expect(buildResults).toContain('Done compiling TypeScript files');
    checkFilesExist(
      `dist/libs/${plugin}/src/migrations/update-${version}/update-${version}.js`,
      `dist/libs/${plugin}/src/migrations/update-${version}/update-${version}.ts`,
      `libs/${plugin}/src/migrations/update-${version}/update-${version}.ts`
    );
    const migrationsJson = readJson(`libs/${plugin}/migrations.json`);
    expect(migrationsJson).toMatchObject({
      generators: expect.objectContaining({
        [`update-${version}`]: {
          version: version,
          description: `update-${version}`,
          cli: `nx`,
          implementation: `./src/migrations/update-${version}/update-${version}`,
        },
      }),
    });
    done();
  }, 45000);

  it('should be able to generate a generator', async (done) => {
    newProject();
    const plugin = uniq('plugin');
    const generator = uniq('generator');

    runCLI(
      `generate @nrwl/nx-plugin:plugin ${plugin} --linter=eslint --importPath=@proj/${plugin}`
    );
    runCLI(
      `generate @nrwl/nx-plugin:generator ${generator} --project=${plugin}`
    );

    const lintResults = runCLI(`lint ${plugin}`);
    expect(lintResults).toContain('All files pass linting.');

    expectTestsPass(await runCLIAsync(`test ${plugin}`));

    const buildResults = runCLI(`build ${plugin}`);
    expect(buildResults).toContain('Done compiling TypeScript files');
    checkFilesExist(
      `libs/${plugin}/src/generators/${generator}/schema.d.ts`,
      `libs/${plugin}/src/generators/${generator}/schema.json`,
      `libs/${plugin}/src/generators/${generator}/generator.ts`,
      `libs/${plugin}/src/generators/${generator}/generator.spec.ts`,
      `dist/libs/${plugin}/src/generators/${generator}/schema.d.ts`,
      `dist/libs/${plugin}/src/generators/${generator}/schema.json`,
      `dist/libs/${plugin}/src/generators/${generator}/generator.js`,
      `dist/libs/${plugin}/src/generators/${generator}/generator.spec.ts`
    );
    const generatorJson = readJson(`libs/${plugin}/generators.json`);
    expect(generatorJson).toMatchObject({
      generators: expect.objectContaining({
        [generator]: {
          factory: `./src/generators/${generator}/generator`,
          schema: `./src/generators/${generator}/schema.json`,
          description: `${generator} generator`,
        },
      }),
    });
    done();
  }, 45000);

  it('should be able to generate a executor', async (done) => {
    newProject();
    const plugin = uniq('plugin');
    const executor = uniq('executor');

    runCLI(
      `generate @nrwl/nx-plugin:plugin ${plugin} --linter=eslint --importPath=@proj/${plugin}`
    );
    runCLI(`generate @nrwl/nx-plugin:executor ${executor} --project=${plugin}`);

    const lintResults = runCLI(`lint ${plugin}`);
    expect(lintResults).toContain('All files pass linting.');

    expectTestsPass(await runCLIAsync(`test ${plugin}`));

    const buildResults = runCLI(`build ${plugin}`);
    expect(buildResults).toContain('Done compiling TypeScript files');
    checkFilesExist(
      `libs/${plugin}/src/executors/${executor}/schema.d.ts`,
      `libs/${plugin}/src/executors/${executor}/schema.json`,
      `libs/${plugin}/src/executors/${executor}/executor.ts`,
      `libs/${plugin}/src/executors/${executor}/executor.spec.ts`,
      `dist/libs/${plugin}/src/executors/${executor}/schema.d.ts`,
      `dist/libs/${plugin}/src/executors/${executor}/schema.json`,
      `dist/libs/${plugin}/src/executors/${executor}/executor.js`,
      `dist/libs/${plugin}/src/executors/${executor}/executor.spec.ts`
    );
    const executorsJson = readJson(`libs/${plugin}/executors.json`);
    expect(executorsJson).toMatchObject({
      executors: expect.objectContaining({
        [executor]: {
          implementation: `./src/executors/${executor}/executor`,
          schema: `./src/executors/${executor}/schema.json`,
          description: `${executor} executor`,
        },
      }),
    });
    done();
  }, 45000);

  describe('--directory', () => {
    it('should create a plugin in the specified directory', () => {
      newProject();
      const plugin = uniq('plugin');
      runCLI(
        `generate @nrwl/nx-plugin:plugin ${plugin} --linter=eslint --directory subdir --importPath=@proj/${plugin}`
      );
      checkFilesExist(`libs/subdir/${plugin}/package.json`);
      const workspace = readJson(workspaceConfigName());
      expect(workspace.projects[`subdir-${plugin}`]).toBeTruthy();
      expect(workspace.projects[`subdir-${plugin}`].root).toBe(
        `libs/subdir/${plugin}`
      );
      expect(workspace.projects[`subdir-${plugin}-e2e`]).toBeTruthy();
    }, 45000);
  });
  describe('--tags', () => {
    it('should add tags to nx.json', async () => {
      newProject();
      const plugin = uniq('plugin');
      runCLI(
        `generate @nrwl/nx-plugin:plugin ${plugin} --linter=eslint --tags=e2etag,e2ePackage --importPath=@proj/${plugin}`
      );
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
    }, 45000);
  });
});
