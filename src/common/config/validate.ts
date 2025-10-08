import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { EnvironmentVariables } from '#config/env';

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { forbidUnknownValues: false });

  if (errors.length > 0) {
    console.error(
      `Error while parsing env variables\n` +
        errors.map((error) => error.toString(true, true, '', true)).join(''),
    );
    process.exit(1);
  }

  return validatedConfig;
}
