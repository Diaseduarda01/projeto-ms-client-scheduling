import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clienteApi } from '../lib/api';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

interface Agendamento {
  id: string;
  servicoNome: string;
  empresaSlug: string;
  dataHora: string;
  status: string;
  cancelToken?: string;
}

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  return {
    day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'CONFIRMADO':
      return 'bg-green-100 text-green-700';
    case 'CONCLUIDO':
      return 'bg-gray-100 text-gray-700';
    case 'CANCELADO':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'CONFIRMADO':
      return 'Confirmado';
    case 'CONCLUIDO':
      return 'Concluído';
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return status;
  }
}

export function MeusAgendamentosPage() {
  const { usuario, logout } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clienteApi.getAgendamentos().then(setAgendamentos).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header usuario={usuario} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus agendamentos</h1>

        {agendamentos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">Você ainda não tem agendamentos</p>
            <Link to="/" className="btn btn-primary inline-flex">
              Agendar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentos.map((agendamento) => {
              const { day, time } = formatDateTime(agendamento.dataHora);
              return (
                <div
                  key={agendamento.id}
                  className="card flex items-center gap-4"
                >
                  <div className="w-14 text-center">
                    <div className="text-lg font-bold text-gray-900">{day.split(' ')[0]}</div>
                    <div className="text-xs text-gray-500 uppercase">{day.split(' ')[1]}</div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{agendamento.servicoNome}</h3>
                    <p className="text-sm text-gray-500">{time}</p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agendamento.status)}`}>
                    {getStatusLabel(agendamento.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
