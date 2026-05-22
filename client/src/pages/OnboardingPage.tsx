import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numbers = telefone.replace(/\D/g, '');

    if (numbers.length < 10 || numbers.length > 11) {
      setError('Telefone inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await clienteApi.updateTelefone(numbers);
      await refetch();
      navigate('/');
    } catch {
      setError('Erro ao salvar telefone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Seu telefone</h1>
          <p className="text-gray-500 mt-2">
            Precisamos do seu número para enviar lembretes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(formatTelefone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="input text-center text-lg"
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-4"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
