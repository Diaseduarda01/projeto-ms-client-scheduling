import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { catalogApi } from '../lib/api';
import type { Profissional } from '../lib/api';
import { Header } from '../components/Header';
import { Stepper } from '../components/Stepper';
import { ProfissionalCard } from '../components/ProfissionalCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const STEPS = ['Serviço', 'Profissional', 'Horário', 'Confirmar'];

export function ProfissionaisPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const servicoId = location.state?.servicoId;

  useEffect(() => {
    if (!servicoId) {
      navigate(`/${slug}/servicos`);
      return;
    }
    if (slug) {
      catalogApi.getProfissionais(slug, servicoId).then(setProfissionais).finally(() => setLoading(false));
    }
  }, [slug, servicoId, navigate]);

  const handleContinue = () => {
    if (slug) {
      navigate(`/${slug}/calendario`, {
        state: { servicoId, funcionarioId: selected },
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header empresaNome={slug} usuario={usuario} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Stepper steps={STEPS} currentStep={1} />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Escolha o profissional</h1>
          <p className="text-gray-500 mt-1">Ou deixe em branco para qualquer disponível</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setSelected(null)}
            className={`
              p-4 rounded-3xl border-2 text-center transition-all flex flex-col items-center gap-3
              ${
                selected === null
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }
            `}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Qualquer</span>
          </button>

          {profissionais.map((prof) => (
            <ProfissionalCard
              key={prof.id}
              nome={prof.nome}
              foto={prof.foto}
              selected={selected === prof.id}
              onClick={() => setSelected(prof.id)}
            />
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            <button onClick={handleContinue} className="btn btn-primary w-full">
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
