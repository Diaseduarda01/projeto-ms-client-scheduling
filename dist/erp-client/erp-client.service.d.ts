import { HttpService } from '@nestjs/axios';
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
export declare class ErpClientService {
    private readonly http;
    constructor(http: HttpService);
    getEmpresaBySlug(slug: string): Promise<Empresa>;
    getEmpresaPublic(slug: string): Promise<EmpresaPublic>;
    getServicos(slug: string): Promise<Servico[]>;
    getProfissionais(slug: string, servicoId?: string): Promise<Profissional[]>;
    getDisponibilidade(slug: string, servicoId: string, data: string, funcionarioId?: string): Promise<Disponibilidade>;
    verificarDisponibilidade(empresaId: string, servicoId: string, funcionarioId: string | null, dataHoraInicio: string, dataHoraFim: string): Promise<boolean>;
    criarAgendamento(dto: CreateAgendamentoDto): Promise<{
        id: string;
    }>;
    cancelarAgendamento(agendamentoId: string): Promise<void>;
}
