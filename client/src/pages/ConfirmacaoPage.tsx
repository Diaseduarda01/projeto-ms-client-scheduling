import { useLocation, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const day = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { day, time };
}

export function ConfirmacaoPage() {
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const { session } = location.state || {};

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Sessão não encontrada</p>
          <Link to="/" className="text-violet-600 hover:underline mt-2 inline-block">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  const { day, time } = formatDateTime(session.resumo.dataHora);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header usuario={usuario} onLogout={logout} />

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamento confirmado!</h1>
          <p className="text-gray-500 mt-1">
            Você receberá um lembrete antes do horário
          </p>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{session.resumo.servico}</h3>
              <p className="text-sm text-gray-500">Serviço</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{session.resumo.profissional}</h3>
              <p className="text-sm text-gray-500">Profissional</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 capitalize">{day}</h3>
              <p className="text-sm text-gray-500">às {time}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Link to="/meus-agendamentos" className="btn btn-primary w-full">
            Ver meus agendamentos
          </Link>
          <Link to="/" className="btn btn-secondary w-full">
            Voltar ao início
          </Link>
        </div>

        {session.cancelToken && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Para cancelar, acesse o link enviado por e-mail ou WhatsApp
          </p>
        )}
      </div>
    </div>
  );
}
