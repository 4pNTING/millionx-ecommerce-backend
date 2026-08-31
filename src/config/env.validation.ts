type Environment = Record<string, unknown>;

const requireString = (config: Environment, key: string): string => {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
};

export const validateEnvironment = (config: Environment): Environment => {
  const jwtSecret = requireString(config, 'JWT_SECRET');

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  return {
    ...config,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRATION: requireString(config, 'JWT_EXPIRATION'),
  };
};
