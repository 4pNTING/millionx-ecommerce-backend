type Environment = Record<string, unknown>;

const requireString = (config: Environment, key: string): string => {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
};

const positiveInteger = (config: Environment, key: string, fallback: number): number => {
  const value = config[key] ?? fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return parsed;
};

export const validateEnvironment = (config: Environment): Environment => {
  const jwtSecret = requireString(config, 'JWT_SECRET');
  const jwtRefreshSecret = requireString(config, 'JWT_REFRESH_SECRET');

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  if (jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
  }

  if (jwtRefreshSecret === jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET must be different from JWT_SECRET');
  }

  return {
    ...config,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRATION: requireString(config, 'JWT_EXPIRATION'),
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    JWT_REFRESH_EXPIRATION: requireString(config, 'JWT_REFRESH_EXPIRATION'),
    AUTH_LOGIN_RATE_LIMIT_MAX: positiveInteger(config, 'AUTH_LOGIN_RATE_LIMIT_MAX', 5),
    AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS: positiveInteger(
      config,
      'AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS',
      60,
    ),
    AUTH_REGISTER_RATE_LIMIT_MAX: positiveInteger(config, 'AUTH_REGISTER_RATE_LIMIT_MAX', 3),
    AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS: positiveInteger(
      config,
      'AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS',
      3600,
    ),
  };
};
