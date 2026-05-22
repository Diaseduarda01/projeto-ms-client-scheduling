import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { ServicosPage } from './pages/ServicosPage';
import { ProfissionaisPage } from './pages/ProfissionaisPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { ResumoPage } from './pages/ResumoPage';
import { PagamentoPage } from './pages/PagamentoPage';
import { ConfirmacaoPage } from './pages/ConfirmacaoPage';
import { MeusAgendamentosPage } from './pages/MeusAgendamentosPage';
import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.precisaOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/meus-agendamentos" element={<PrivateRoute><MeusAgendamentosPage /></PrivateRoute>} />

      <Route path="/:slug" element={<HomePage />} />
      <Route path="/:slug/servicos" element={<ServicosPage />} />
      <Route path="/:slug/profissionais" element={<ProfissionaisPage />} />
      <Route path="/:slug/calendario" element={<PrivateRoute><CalendarioPage /></PrivateRoute>} />
      <Route path="/:slug/resumo" element={<PrivateRoute><ResumoPage /></PrivateRoute>} />
      <Route path="/:slug/pagamento" element={<PrivateRoute><PagamentoPage /></PrivateRoute>} />
      <Route path="/:slug/confirmacao" element={<PrivateRoute><ConfirmacaoPage /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
