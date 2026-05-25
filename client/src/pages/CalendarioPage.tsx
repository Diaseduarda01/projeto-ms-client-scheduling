import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { catalogApi } from '../lib/api';
import type { Horario } from '../lib/api';
import { Header } from '../components/Header';
import { Stepper } from '../components/Stepper';
import { HorarioSlot } from '../components/HorarioSlot';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

const STEPS = ['Serviço', 'Profissional', 'Horário', 'Confirmar'];

function getNextDays(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  return days;
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatDayName(date: Date) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[date.getDay()];
}

export function CalendarioPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const [loading, setLoading] = useState(false);

  const { servicoId, funcionarioId } = location.state || {};
  const days = getNextDays(14);

  useEffect(() => {
    if (!servicoId) {
      navigate(`/${slug}/servicos`);
      return;
    }

    setLoading(true);
    setSelectedHorario(null);

    catalogApi
      .getDisponibilidade(slug!, servicoId, formatDate(selectedDate), funcionarioId)
      .then((data) => setHorarios(data?.horarios || []))
      .catch(() => setHorarios([]))
      .finally(() => setLoading(false));
  }, [slug, servicoId, funcionarioId, selectedDate, navigate]);

  const handleContinue = () => {
    if (selectedHorario && slug) {
      const dataHoraInicio = `${formatDate(selectedDate)}T${selectedHorario.inicio}:00`;
      navigate(`/${slug}/resumo`, {
        state: {
          servicoId,
          funcionarioId: selectedHorario.funcionarioId,
          funcionarioNome: selectedHorario.funcionarioNome,
          dataHoraInicio,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header empresaNome={slug} usuario={usuario} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Stepper steps={STEPS} currentStep={2} />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Escolha o horário</h1>
          <p className="text-gray-500 mt-1">Selecione a data e o horário</p>
        </div>

        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-2">
            {days.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  flex-shrink-0 w-16 py-3 rounded-2xl text-center transition-all
                  ${
                    formatDate(day) === formatDate(selectedDate)
                      ? 'bg-violet-600 text-white'
                      : 'bg-white border border-gray-100 text-gray-700 hover:border-violet-200'
                  }
                `}
              >
                <div className="text-xs font-medium">{formatDayName(day)}</div>
                <div className="text-lg font-bold">{day.getDate()}</div>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : horarios.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">Nenhum horário disponível neste dia</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {horarios.map((horario, index) => (
              <HorarioSlot
                key={index}
                horario={horario.inicio}
                profissional={!funcionarioId ? horario.funcionarioNome : undefined}
                selected={selectedHorario?.inicio === horario.inicio && selectedHorario?.funcionarioId === horario.funcionarioId}
                onClick={() => setSelectedHorario(horario)}
              />
            ))}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleContinue}
              disabled={!selectedHorario}
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
