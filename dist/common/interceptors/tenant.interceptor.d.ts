import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ErpClientService, Empresa } from '../../erp-client/erp-client.service';
declare module 'express' {
    interface Request {
        empresa?: Empresa;
    }
}
export declare class TenantInterceptor implements NestInterceptor {
    private readonly erpClient;
    constructor(erpClient: ErpClientService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
