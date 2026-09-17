import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class StaffCustomerReadGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = GqlExecutionContext.create(context).getContext().req;
    const isStaff = request.user?.actorType === 'staff';
    const canReadCustomers = request.user?.role === 'admin' || request.user?.role === 'manager';

    if (!isStaff || !canReadCustomers) {
      throw new ForbiddenException('Customer list requires admin or manager role');
    }

    return true;
  }
}
