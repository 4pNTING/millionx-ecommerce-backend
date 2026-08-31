import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class CustomerAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = GqlExecutionContext.create(context).getContext().req;
    if (request.user?.actorType !== 'customer' || !request.user?.customerId) {
      throw new ForbiddenException('Customer account token is required');
    }
    return true;
  }
}
