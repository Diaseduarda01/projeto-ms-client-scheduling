import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function DashboardPage() {
  const { usuario, loading, logout } = useAuth();

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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {usuario?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">O que você gostaria de fazer?</p>
        </div>

        <div className="space-y-4">
          <Link to="/meus-agendamentos" className="card block hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Meus agendamentos</h3>
                <p className="text-sm text-gray-500">Ver histórico e próximos horários</p>
              </div>
            </div>
          </Link>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-2">Agendar novo horário</h3>
            <p className="text-sm text-gray-500 mb-4">
              Para agendar, acesse o link da empresa desejada.
            </p>
            <p className="text-xs text-gray-400">
              Exemplo: /nome-da-empresa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
