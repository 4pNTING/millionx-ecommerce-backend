import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class CatalogWriteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request =
      context.getType().toString() === 'http'
        ? context.switchToHttp().getRequest()
        : GqlExecutionContext.create(context).getContext().req;

    if (request.user?.role !== 'admin' && request.user?.role !== 'manager') {
      throw new ForbiddenException('Catalog changes require admin or manager role');
    }
    return true;
  }
}
