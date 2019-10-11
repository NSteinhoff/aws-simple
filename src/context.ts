import path from 'path';
import {AppConfig} from '.';

export type ExportName = 'rest-api-url' | 's3-bucket-name';

export type ResourceName =
  | 'a-record'
  | 'certificate'
  | 'lambda'
  | 'rest-api'
  | 'rest-api-url-output'
  | 's3-bucket'
  | 's3-bucket-name-output'
  | 's3-integration-policy'
  | 's3-integration-role'
  | 'stack'
  | 'zone';

function assertName(value: string, valueName: string): void {
  const regExp = /^[a-z0-9-]+$/;

  if (!regExp.test(value)) {
    throw new Error(
      `The specified ${valueName} (${value}) contains invalid characters. It should match the following pattern: ${regExp.toString()}`
    );
  }
}

// tslint:disable-next-line: no-any
function isAppConfig(value: any): value is AppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    typeof value.appName === 'string' &&
    typeof value.defaultStackName === 'string'
  );
}

export class Context {
  public static load(configFilename: string, stackName?: string): Context {
    const absoluteConfigFilename = path.resolve(configFilename);

    try {
      const appConfig = require(absoluteConfigFilename).default;

      if (!isAppConfig(appConfig)) {
        throw new Error('No valid default export found.');
      }

      return new Context(appConfig, stackName);
    } catch (error) {
      throw new Error(
        `The specified config file cannot be loaded: ${absoluteConfigFilename}\nCause: ${error.message}`
      );
    }
  }

  public constructor(
    public readonly appConfig: AppConfig,
    public readonly stackName: string = appConfig.defaultStackName
  ) {
    assertName(appConfig.appName, 'app name');
    assertName(stackName, 'stack name');
  }

  public deriveNewContext(stackName: string): Context {
    return new Context(this.appConfig, stackName);
  }

  public getOutputId(exportName: ExportName): string {
    return `${this.appConfig.appName}-${this.stackName}-output-${exportName}`;
  }

  public getResourceId(resourceName: ResourceName): string {
    return `${this.appConfig.appName}-${this.stackName}-resource-${resourceName}`;
  }

  public parseStackName(id: string): string {
    const regExp = new RegExp(
      `^${this.appConfig.appName}-(.*)-(?:output|resource)-.+`
    );

    const result = regExp.exec(id);

    if (!result) {
      throw new Error(`'Unable to parse stack name from ID: ${id}`);
    }

    return result[1];
  }
}
