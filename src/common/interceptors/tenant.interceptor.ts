import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ErpClientService, Empresa } from '../../erp-client/erp-client.service';

declare module 'express' {
  interface Request {
    empresa?: Empresa;
  }
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly erpClient: ErpClientService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const slug = request.params.slug;

    if (slug) {
      try {
        const empresa = await this.erpClient.getEmpresaBySlug(slug);
        request.empresa = empresa;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new NotFoundException(`Empresa não encontrada: ${slug}`);
      }
    }

    return next.handle();
  }
}
