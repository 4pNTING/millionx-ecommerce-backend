import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaFactory, GraphQLSchemaBuilderModule } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { writeFileSync } from 'fs';
import { join } from 'path';

import { AuthResolver } from '../src/infrastructure/resolvers/auth/auth.resolver';
import { ZoneResolver } from '../src/infrastructure/resolvers/zone/zone.resolver';
import { CategoryResolver } from '../src/infrastructure/resolvers/category/category.resolver';
import { ProductResolver } from '../src/infrastructure/resolvers/product/product.resolver';
import { CustomerResolver } from '../src/infrastructure/resolvers/customer/customer.resolver';
import { CustomerAuthResolver } from '../src/infrastructure/resolvers/customer/customer-auth.resolver';
import { CartResolver } from '../src/infrastructure/resolvers/cart/cart.resolver';
import { CheckoutResolver } from '../src/infrastructure/resolvers/checkout/checkout.resolver';
import { WishlistResolver } from '../src/infrastructure/resolvers/wishlist/wishlist.resolver';
import { DateScalar } from '../src/infrastructure/common/graphql/date.scalar';

async function generateSchema() {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: false });
  await app.init();
  const factory = app.get(GraphQLSchemaFactory);
  const schema = await factory.create(
    [
      AuthResolver,
      ZoneResolver,
      CategoryResolver,
      ProductResolver,
      CustomerResolver,
      CustomerAuthResolver,
      CartResolver,
      CheckoutResolver,
      WishlistResolver,
    ],
    [DateScalar],
  );

  const header = `# ------------------------------------------------------\n# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)\n# ------------------------------------------------------\n\n`;
  const schemaPath = join(process.cwd(), 'src/schema.gql');
  writeFileSync(schemaPath, header + printSchema(schema) + '\n', 'utf8');
  console.log(`Updated GraphQL schema at ${schemaPath}`);
  await app.close();
}

generateSchema().catch((err) => {
  console.error('Failed to generate GraphQL schema:', err);
  process.exit(1);
});
