import { QueryRunner } from 'typeorm';
import {
  RegisterCustomerRequest,
  RegisteredCustomerAccount,
} from '../../../../domain/models/customer-auth.model';
import { CustomerAccountEntity } from '../../../entities/customer-account.entity';
import { CustomerEntity } from '../../../entities/customer.entity';
import { ValidatedCustomerRegistration } from './registerCustomer.validation';

export class RegisterCustomerAction {
  constructor(private readonly session: QueryRunner) {}

  async execute(
    input: RegisterCustomerRequest,
    passwordHash: string,
    validated: ValidatedCustomerRegistration,
  ): Promise<RegisteredCustomerAccount> {
    const customers = this.session.manager.getRepository(CustomerEntity);
    const accounts = this.session.manager.getRepository(CustomerAccountEntity);
    let customer = validated.customer;
    if (customer) {
      Object.assign(customer, {
        firstName: input.firstName ?? customer.firstName,
        lastName: input.lastName ?? customer.lastName,
        email: validated.email ?? customer.email,
        phone: validated.phone ?? customer.phone,
      });
    } else {
      customer = customers.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email: validated.email,
        phone: validated.phone,
      });
    }
    customer = await customers.save(customer);
    const account = await accounts.save(accounts.create({ customerId: customer.id, passwordHash }));
    return { accountId: account.id, customer: { ...customer, addresses: [] } };
  }
}
