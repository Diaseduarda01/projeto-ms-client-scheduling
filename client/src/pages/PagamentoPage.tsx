import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { bookingApi } from '../lib/api';
import type { BookingSession } from '../lib/api';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

export function PagamentoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [session, setSession] = useState<BookingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900);
  const [copied, setCopied] = useState(false);

  const { sessionId } = location.state || {};

  useEffect(() => {
    if (!sessionId || !slug) {
      navigate(`/${slug}/servicos`);
      return;
    }

    bookingApi.generatePix(slug, sessionId).then(setSession).finally(() => setLoading(false));
  }, [slug, sessionId, navigate]);

  useEffect(() => {
    if (!session?.pix) return;

    const expiracao = new Date(session.pix.expiracao).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiracao - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        navigate(`/${slug}/servicos`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, slug, navigate]);

  useEffect(() => {
    if (!sessionId || !slug || !session?.pix) return;

    const pollInterval = setInterval(async () => {
      try {
        const updated = await bookingApi.getSession(slug, sessionId);
        if (updated.status === 'CONFIRMADO') {
          clearInterval(pollInterval);
          navigate(`/${slug}/confirmacao`, { state: { session: updated } });
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [sessionId, slug, session, navigate]);

  const handleCopy = () => {
    if (session?.pix?.qrCode) {
      navigator.clipboard.writeText(session.pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !session?.pix) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header empresaNome={slug} usuario={usuario} onLogout={logout} />

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pague com Pix</h1>
          <p className="text-gray-500 mt-1">
            Escaneie o código ou copie a chave
          </p>
        </div>

        <div className="card">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100">
              <img
                src={session.pix.qrCodeBase64}
                alt="QR Code Pix"
                className="w-48 h-48"
              />
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-violet-600">
              R$ {session.resumo.valorGarantia}
            </div>
            <div className="text-sm text-gray-500 mt-1">Garantia (50%)</div>
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 rounded-2xl py-3 mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="btn btn-secondary w-full"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar código Pix
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Aguardando confirmação do pagamento...
          </p>
        </div>
      </div>
    </div>
  );
}
