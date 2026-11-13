require('ts-node/register');
const { NestFactory } = require('@nestjs/core');
const { GraphQLSchemaFactory, GraphQLSchemaBuilderModule } = require('@nestjs/graphql');
const { printSchema } = require('graphql');
const { writeFileSync } = require('fs');
const { join } = require('path');

const { AuthResolver } = require('../src/infrastructure/resolvers/auth/auth.resolver');
const { ZoneResolver } = require('../src/infrastructure/resolvers/zone/zone.resolver');
const { CategoryResolver } = require('../src/infrastructure/resolvers/category/category.resolver');
const { ProductResolver } = require('../src/infrastructure/resolvers/product/product.resolver');
const { CustomerResolver } = require('../src/infrastructure/resolvers/customer/customer.resolver');
const { CustomerAuthResolver } = require('../src/infrastructure/resolvers/customer/customer-auth.resolver');
const { CartResolver } = require('../src/infrastructure/resolvers/cart/cart.resolver');
const { CheckoutResolver } = require('../src/infrastructure/resolvers/checkout/checkout.resolver');
const { WishlistResolver } = require('../src/infrastructure/resolvers/wishlist/wishlist.resolver');
const { DateScalar } = require('../src/infrastructure/common/graphql/date.scalar');

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

