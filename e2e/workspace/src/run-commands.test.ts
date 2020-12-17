import {
  newProject,
  readJson,
  runCLI,
  uniq,
  updateFile,
  workspaceConfigName,
} from '@nrwl/e2e/utils';

describe('Run Commands', () => {
  it('should not override environment variables already set when setting a custom env file path', async (done) => {
    newProject();
    const nodeapp = uniq('nodeapp');
    updateFile(
      `.env`,
      'SHARED_VAR=shared-root-value\nROOT_ONLY=root-only-value'
    );
    runCLI(`generate @nrwl/express:app ${nodeapp}`);
    updateFile(
      `apps/${nodeapp}/.custom.env`,
      'SHARED_VAR=shared-nested-value\nNESTED_ONLY=nested-only-value'
    );

    const command = `echo "$SHARED_VAR $ROOT_ONLY $NESTED_ONLY"`;
    const envFile = `apps/${nodeapp}/.custom.env`;
    runCLI(
      `generate @nrwl/workspace:run-commands echoEnvVariables --command='${command}' --envFile='${envFile}' --project=${nodeapp}`
    );

    const result = runCLI('echoEnvVariables');
    expect(result).toContain('shared-root-value');
    expect(result).not.toContain('shared-nested-value');
    expect(result).toContain('root-only-value');
    expect(result).toContain('nested-only-value');
    done();
  }, 120000);

  it('should interpolate provided arguments', async (done) => {
    newProject();
    const myapp = uniq('myapp1');

    runCLI(`generate @nrwl/web:app ${myapp}`);

    const config = readJson(workspaceConfigName());
    config.projects[myapp].targets.echo = {
      executor: '@nrwl/workspace:run-commands',
      options: {
        commands: [`echo 'print: {args.var1}'`, `echo 'print: {args.var2}'`],
      },
    };
    updateFile(workspaceConfigName(), JSON.stringify(config));

    const result = runCLI('echo --var1=x --var2=y');
    expect(result).toContain('print: x');
    expect(result).toContain('print: y');
    done();
  }, 120000);
});
