import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { catalogApi, bookingApi } from '../lib/api';
import type { Servico } from '../lib/api';
import { Header } from '../components/Header';
import { Stepper } from '../components/Stepper';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const STEPS = ['Serviço', 'Profissional', 'Horário', 'Confirmar'];

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const day = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { day, time };
}

export function ResumoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [servico, setServico] = useState<Servico | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { servicoId, funcionarioId, funcionarioNome, dataHoraInicio } = location.state || {};

  useEffect(() => {
    if (!servicoId || !dataHoraInicio) {
      navigate(`/${slug}/servicos`);
      return;
    }

    catalogApi.getServicos(slug!).then((servicos) => {
      const found = servicos.find((s) => s.id === servicoId);
      setServico(found || null);
      setLoading(false);
    });
  }, [slug, servicoId, dataHoraInicio, navigate]);

  const handleConfirm = async () => {
    if (!slug || !servico) return;

    setSubmitting(true);
    try {
      const session = await bookingApi.createSession(slug, {
        servicoId,
        funcionarioId,
        dataHoraInicio,
      });

      if (session.resumo.valorGarantia) {
        navigate(`/${slug}/pagamento`, { state: { sessionId: session.sessionId } });
      } else {
        const confirmed = await bookingApi.confirmSession(slug, session.sessionId);
        navigate(`/${slug}/confirmacao`, { state: { session: confirmed } });
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !servico) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { day, time } = formatDateTime(dataHoraInicio);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header empresaNome={slug} usuario={usuario} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Stepper steps={STEPS} currentStep={3} />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Confirme seu agendamento</h1>
          <p className="text-gray-500 mt-1">Revise os detalhes antes de confirmar</p>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{servico.nome}</h3>
              <p className="text-sm text-gray-500">{servico.duracaoMinutos} minutos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {funcionarioNome || 'Qualquer disponível'}
              </h3>
              <p className="text-sm text-gray-500">Profissional</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
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

          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-500">Valor total</span>
            <span className="text-2xl font-bold text-violet-600">R$ {servico.preco}</span>
          </div>

          {servico.valorGarantia && (
            <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-amber-800">
                  Será necessário pagar <strong>R$ {servico.valorGarantia}</strong> como garantia para confirmar o agendamento.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="btn btn-primary w-full"
            >
              {submitting ? (
                <LoadingSpinner size="sm" />
              ) : servico.valorGarantia ? (
                'Pagar e confirmar'
              ) : (
                'Confirmar agendamento'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
