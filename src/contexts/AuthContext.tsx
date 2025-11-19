import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleSheetsService } from '../services/googleSheets';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analista' | 'entrevistador';
  active: boolean;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isAnalyst: () => boolean;
  isInterviewer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(role: string): 'admin' | 'analista' | 'entrevistador' {
  const normalized = String(role || '').toLowerCase().trim();

  if (normalized === 'admin' || normalized === 'administrador') return 'admin';
  if (normalized === 'analista') return 'analista';
  if (normalized === 'entrevistador') return 'entrevistador';

  console.warn(`⚠️ Role desconhecido: "${role}", usando "analista" como padrão`);
  return 'analista';
}

async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log('═'.repeat(60));
    console.log('🔎 [AuthContext] Buscando usuário:', email);
    console.log('═'.repeat(60));

    const result = await googleSheetsService.getUserRole(email);
    console.log('📥 [AuthContext] Resposta completa:', JSON.stringify(result, null, 2));

    if (!result) {
      console.error('❌ [AuthContext] Resultado null/undefined');
      return null;
    }

    if (!result.success) {
      console.error('❌ [AuthContext] Falha na busca:', result.error);
      return null;
    }

    if (!result.data) {
      console.error('❌ [AuthContext] Sem dados retornados');
      return null;
    }

    const userRoleData = result.data;
    console.log('📦 [AuthContext] UserRoleData:', JSON.stringify(userRoleData, null, 2));

    const userData = userRoleData.user;

    if (!userData) {
      console.error('❌ [AuthContext] Usuário não encontrado em result.data.user');
      return null;
    }

    console.log('👤 [AuthContext] UserData bruto:', JSON.stringify(userData, null, 2));

    const user: User = {
      id: userData.email || userData.Email,
      email: userData.email || userData.Email,
      name: userData.name || userData.Nome || userData.email || userData.Email,
      role: normalizeRole(userData.role || userData.Role),
      active: true
    };

    console.log('✅ [AuthContext] Usuário processado:', JSON.stringify(user, null, 2));
    console.log('🎭 [AuthContext] Role normalizado:', user.role);
    console.log('═'.repeat(60));

    return user;
  } catch (error) {
    console.error('❌ [AuthContext] Erro ao buscar usuário:', error);
    throw error;
  }
}

async function getUserById(id: string): Promise<User | null> {
  return getUserByEmail(id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se há usuário salvo no localStorage
  useEffect(() => {
    checkStoredUser();
  }, []);

  async function checkStoredUser() {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('currentUser');

      if (storedUser) {
        const userData: User = JSON.parse(storedUser);

        const freshUser = await getUserById(userData.id);

        if (freshUser && freshUser.active) {
          setUser(freshUser);
        } else {
          localStorage.removeItem('currentUser');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao verificar usuário armazenado:', error);
      localStorage.removeItem('currentUser');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setLoading(true);

      console.log('═'.repeat(60));
      console.log('🔐 [AuthContext] INICIANDO LOGIN');
      console.log('═'.repeat(60));
      console.log('📧 Email:', email);

      const userData = await getUserByEmail(email.toLowerCase().trim());

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      if (!userData.active) {
        throw new Error('Usuário inativo');
      }

      console.log('═'.repeat(60));
      console.log('✅ [AuthContext] LOGIN BEM-SUCEDIDO');
      console.log('═'.repeat(60));
      console.log('User:', JSON.stringify(userData, null, 2));
      console.log('🎭 Role:', userData.role);
      console.log('🧪 Testes:');
      console.log('  role === "admin":', userData.role === 'admin');
      console.log('  role === "analista":', userData.role === 'analista');
      console.log('  role === "entrevistador":', userData.role === 'entrevistador');
      console.log('═'.repeat(60));

      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));

    } catch (error) {
      console.error('❌ [AuthContext] Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setLoading(true);
      setUser(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  }

  function isAdmin(): boolean {
    return user?.role === 'admin';
  }

  function isAnalyst(): boolean {
    return user?.role === 'analista';
  }

  function isInterviewer(): boolean {
    return user?.role === 'entrevistador';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isAnalyst, isInterviewer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

