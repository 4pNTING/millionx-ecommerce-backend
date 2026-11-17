import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function generateSchema() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  await app.close();
  console.log('src/schema.gql successfully generated!');
  process.exit(0);
}

generateSchema().catch((err) => {
  console.error('Failed to generate schema:', err);
  process.exit(1);
});
