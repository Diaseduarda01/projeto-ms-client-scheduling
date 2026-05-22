import { ErpClientService } from '../erp-client/erp-client.service';
export declare class CatalogController {
    private readonly erpClient;
    constructor(erpClient: ErpClientService);
    getEmpresa(slug: string): Promise<import("../erp-client/erp-client.service").EmpresaPublic>;
    getServicos(slug: string): Promise<import("../erp-client/erp-client.service").Servico[]>;
    getProfissionais(slug: string, servicoId?: string): Promise<import("../erp-client/erp-client.service").Profissional[]>;
    getDisponibilidade(slug: string, servicoId: string, data: string, funcionarioId?: string): Promise<import("../erp-client/erp-client.service").Disponibilidade>;
}
