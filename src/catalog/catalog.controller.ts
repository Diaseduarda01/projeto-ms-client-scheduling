import { Controller, Get, Param, Query } from '@nestjs/common';
import { ErpClientService } from '../erp-client/erp-client.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly erpClient: ErpClientService) {}

  @Get(':slug')
  async getEmpresa(@Param('slug') slug: string) {
    return this.erpClient.getEmpresaPublic(slug);
  }

  @Get(':slug/servicos')
  async getServicos(@Param('slug') slug: string) {
    return this.erpClient.getServicos(slug);
  }

  @Get(':slug/profissionais')
  async getProfissionais(
    @Param('slug') slug: string,
    @Query('servicoId') servicoId?: string,
  ) {
    return this.erpClient.getProfissionais(slug, servicoId);
  }

  @Get(':slug/disponibilidade')
  async getDisponibilidade(
    @Param('slug') slug: string,
    @Query('servicoId') servicoId: string,
    @Query('data') data: string,
    @Query('funcionarioId') funcionarioId?: string,
  ) {
    return this.erpClient.getDisponibilidade(slug, servicoId, data, funcionarioId);
  }
}
