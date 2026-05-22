import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../lib/api';
import type { Servico } from '../lib/api';
import { Header } from '../components/Header';
import { Stepper } from '../components/Stepper';
import { ServicoCard } from '../components/ServicoCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const STEPS = ['Serviço', 'Profissional', 'Horário', 'Confirmar'];

export function ServicosPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      catalogApi.getServicos(slug).then(setServicos).finally(() => setLoading(false));
    }
  }, [slug]);

  const handleContinue = () => {
    if (selected && slug) {
      navigate(`/${slug}/profissionais`, { state: { servicoId: selected } });
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
    <div className="min-h-screen bg-gray-50">
      <Header empresaNome={slug} usuario={usuario} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Stepper steps={STEPS} currentStep={0} />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Escolha o serviço</h1>
          <p className="text-gray-500 mt-1">Selecione o que você precisa</p>
        </div>

        <div className="space-y-3">
          {servicos.map((servico) => (
            <ServicoCard
              key={servico.id}
              nome={servico.nome}
              descricao={servico.descricao}
              duracao={servico.duracaoMinutos}
              preco={servico.preco}
              selected={selected === servico.id}
              onClick={() => setSelected(servico.id)}
            />
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleContinue}
              disabled={!selected}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
