import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  fotoPerfil?: string;
  telefone?: string;
  precisaOnboarding: boolean;
}

export interface Empresa {
  id: string;
  nome: string;
  slug: string;
  logoUrl?: string;
  endereco?: string;
  telefone?: string;
  horarioFuncionamento?: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  duracaoMinutos: number;
  preco: string;
  valorGarantia?: string;
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

export interface BookingSession {
  sessionId: string;
  status: string;
  resumo: {
    servico: string;
    profissional: string;
    dataHora: string;
    valorTotal: string;
    valorGarantia?: string;
    cliente?: {
      nome: string;
      telefone?: string;
    };
  };
  pix?: {
    qrCode: string;
    qrCodeBase64: string;
    expiracao: string;
  };
  cancelToken?: string;
}

export const authApi = {
  getMe: () => axios.get<Usuario>('/auth/me', { withCredentials: true }).then(r => r.data),
  logout: () => axios.post('/auth/logout', {}, { withCredentials: true }),
};

export const catalogApi = {
  getEmpresa: (slug: string) =>
    axios.get<Empresa>(`/catalog/${slug}`).then(r => r.data),
  getServicos: (slug: string) =>
    axios.get<Servico[]>(`/catalog/${slug}/servicos`).then(r => r.data),
  getProfissionais: (slug: string, servicoId?: string) =>
    axios.get<Profissional[]>(`/catalog/${slug}/profissionais`, {
      params: { servicoId },
    }).then(r => r.data),
  getDisponibilidade: (slug: string, servicoId: string, data: string, funcionarioId?: string) =>
    axios.get<Disponibilidade>(`/catalog/${slug}/disponibilidade`, {
      params: { servicoId, data, funcionarioId },
    }).then(r => r.data),
};

export const bookingApi = {
  createSession: (slug: string, data: { servicoId: string; funcionarioId?: string; dataHoraInicio: string }) =>
    axios.post<BookingSession>(`/book/${slug}/sessao`, data, { withCredentials: true }).then(r => r.data),
  getSession: (slug: string, sessionId: string) =>
    axios.get<BookingSession>(`/book/${slug}/sessao/${sessionId}`, { withCredentials: true }).then(r => r.data),
  confirmSession: (slug: string, sessionId: string) =>
    axios.post<BookingSession>(`/book/${slug}/sessao/${sessionId}/confirmar`, {}, { withCredentials: true }).then(r => r.data),
  generatePix: (slug: string, sessionId: string) =>
    axios.post<BookingSession>(`/book/${slug}/sessao/${sessionId}/pix`, {}, { withCredentials: true }).then(r => r.data),
  cancel: (cancelToken: string) =>
    axios.delete(`/book/cancelar/${cancelToken}`).then(r => r.data),
};

export const clienteApi = {
  updateTelefone: (telefone: string) =>
    axios.patch('/clientes/me/telefone', { telefone }, { withCredentials: true }).then(r => r.data),
  getAgendamentos: () =>
    axios.get('/clientes/me/agendamentos', { withCredentials: true }).then(r => r.data),
};

export default api;
