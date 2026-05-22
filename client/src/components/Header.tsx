import { Link } from 'react-router-dom';

interface HeaderProps {
  empresaNome?: string;
  usuario?: {
    nome: string;
    fotoPerfil?: string;
  } | null;
  onLogout?: () => void;
}

export function Header({ empresaNome, usuario, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {empresaNome?.charAt(0) || 'A'}
            </span>
          </div>
          <span className="font-semibold text-gray-900">
            {empresaNome || 'Agendamento'}
          </span>
        </Link>

        {usuario ? (
          <div className="flex items-center gap-3">
            <Link
              to="/meus-agendamentos"
              className="text-sm text-gray-600 hover:text-violet-600 transition-colors"
            >
              Meus agendamentos
            </Link>
            <div className="flex items-center gap-2">
              {usuario.fotoPerfil ? (
                <img
                  src={usuario.fotoPerfil}
                  alt={usuario.nome}
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {usuario.nome.charAt(0)}
                  </span>
                </div>
              )}
              <button
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sair
              </button>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-sm text-violet-600 font-medium hover:text-violet-700"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
