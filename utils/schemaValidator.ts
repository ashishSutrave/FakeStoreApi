import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { expect } from '@playwright/test';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schemaCache = new Map<string, ValidateFunction>();

export class SchemaValidator {
  private static loadSchema(schemaName: string): ValidateFunction {
    if (schemaCache.has(schemaName)) {
      return schemaCache.get(schemaName)!;
    }

    const schemaPath = path.resolve(process.cwd(), 'schemas', `${schemaName}.schema.json`);
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const validate = ajv.compile(schema);
    schemaCache.set(schemaName, validate);
    return validate;
  }

  static validate(schemaName: string, data: unknown): void {
    const validate = this.loadSchema(schemaName);
    const isValid = validate(data);

    if (!isValid) {
      const errors = validate.errors ?? [];
      const formattedErrors = this.formatErrors(errors);
      throw new Error(`Schema validation failed for '${schemaName}':\n${formattedErrors}`);
    }
  }

  static assertValid(schemaName: string, data: unknown): void {
    const validate = this.loadSchema(schemaName);
    const isValid = validate(data);

    expect(
      isValid,
      `Schema '${schemaName}' validation failed: ${this.formatErrors(validate.errors ?? [])}`
    ).toBeTruthy();
  }

  private static formatErrors(errors: ErrorObject[]): string {
    return errors
      .map((err) => `  - ${err.instancePath || '/'}: ${err.message}`)
      .join('\n');
  }
}
