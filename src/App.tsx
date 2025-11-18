import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import AnalystDashboard from './components/AnalystDashboard';
import InterviewerDashboard from './components/InterviewerDashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  console.log('='.repeat(60));
  console.log('🎯 APP.TSX - ROTEAMENTO');
  console.log('='.repeat(60));
  console.log('👤 Usuário:', JSON.stringify(user, null, 2));
  console.log('🎭 Role:', user.role);
  console.log('🔍 Tipo do role:', typeof user.role);
  console.log('📏 Tamanho do role:', user.role?.length);
  console.log('🔍 Role === "admin":', user.role === 'admin');
  console.log('🔍 Role === "analista":', user.role === 'analista');
  console.log('='.repeat(60));

  if (user.role === 'admin') {
    console.log('✅ Redirecionando para AdminDashboard');
    console.log('='.repeat(60));
    return <AdminDashboard />;
  }

  if (user.role === 'entrevistador') {
    console.log('✅ Redirecionando para InterviewerDashboard');
    console.log('='.repeat(60));
    return <InterviewerDashboard />;
  }

  console.log('✅ Redirecionando para AnalystDashboard');
  console.log('='.repeat(60));
  return <AnalystDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
