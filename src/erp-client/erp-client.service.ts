import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  preco: string;
  valorGarantia: string;
}

export interface Profissional {
  id: string;
  nome: string;
  foto?: string;
}

export interface Horario {
  inicio: string;
  fim: string;
  funcionarioId: string;
  funcionarioNome: string;
}

export interface Disponibilidade {
  data: string;
  horarios: Horario[];
}

export interface Empresa {
  id: string;
  slug: string;
  nome: string;
  plano: 'BASIC' | 'BRONZE' | 'PLATINUM' | 'GOLD';
}

export interface EmpresaPublic {
  id: string;
  nome: string;
  slug: string;
  logoUrl?: string;
  endereco?: string;
  telefone?: string;
  horarioFuncionamento?: string;
}

export interface CreateAgendamentoDto {
  empresaId: string;
  servicoId: string;
  funcionarioId?: string;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string;
  dataHoraInicio: string;
  dataHoraFim: string;
}

@Injectable()
export class ErpClientService {
  constructor(private readonly http: HttpService) {}

  async getEmpresaBySlug(slug: string): Promise<Empresa> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<Empresa>(`/internal/empresas/slug/${slug}`),
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Empresa não encontrada: ${slug}`);
      }
      throw error;
    }
  }

  async getEmpresaPublic(slug: string): Promise<EmpresaPublic> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<EmpresaPublic>(`/public/${slug}`),
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException(`Empresa não encontrada: ${slug}`);
      }
      throw error;
    }
  }

  async getServicos(slug: string): Promise<Servico[]> {
    const { data } = await firstValueFrom(
      this.http.get<Servico[]>(`/public/${slug}/servicos`),
    );
    return data;
  }

  async getProfissionais(slug: string, servicoId?: string): Promise<Profissional[]> {
    const params = servicoId ? { servicoId } : {};
    const { data } = await firstValueFrom(
      this.http.get<Profissional[]>(`/public/${slug}/profissionais`, { params }),
    );
    return data;
  }

  async getDisponibilidade(
    slug: string,
    servicoId: string,
    data: string,
    funcionarioId?: string,
  ): Promise<Disponibilidade> {
    const params: Record<string, string> = { servicoId, data };
    if (funcionarioId) params.funcionarioId = funcionarioId;

    const { data: result } = await firstValueFrom(
      this.http.get<Disponibilidade>(`/public/${slug}/disponibilidade`, { params }),
    );
    return result;
  }

  async verificarDisponibilidade(
    empresaId: string,
    servicoId: string,
    funcionarioId: string | null,
    dataHoraInicio: string,
    dataHoraFim: string,
  ): Promise<boolean> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<{ disponivel: boolean }>('/internal/disponibilidade', {
          params: { empresaId, servicoId, funcionarioId, dataHoraInicio, dataHoraFim },
        }),
      );
      return data.disponivel;
    } catch {
      return false;
    }
  }

  async criarAgendamento(dto: CreateAgendamentoDto): Promise<{ id: string }> {
    const { data } = await firstValueFrom(
      this.http.post<{ id: string }>('/internal/agendamentos', dto),
    );
    return data;
  }

  async cancelarAgendamento(agendamentoId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`/internal/agendamentos/${agendamentoId}`),
    );
  }
}
