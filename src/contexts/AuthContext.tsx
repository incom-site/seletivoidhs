import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analista' | 'entrevistador';
  active: boolean;
  password?: string; // Para autenticação básica
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

// Serviço para comunicação com Google Sheets
class GoogleSheetsService {
  private scriptUrl: string;

  constructor(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
  }

  async fetchData(action: string, data?: any): Promise<any> {
    try {
      if (!this.scriptUrl) {
        throw new Error('URL do Google Script não configurada. Verifique o arquivo .env');
      }

      const url = new URL(this.scriptUrl);
      url.searchParams.append('action', action);

      if (data) {
        Object.keys(data).forEach(key => {
          url.searchParams.append(key, String(data[key]));
        });
      }

      console.log('🔄 Chamando Google Apps Script:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('📡 Resposta recebida - Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Dados recebidos:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro na comunicação com Google Apps Script:', error);
      console.error('🔍 URL configurada:', this.scriptUrl);
      console.error('🔍 Action:', action);
      console.error('🔍 Data:', data);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    console.log('═'.repeat(60));
    console.log('🔎 getUserByEmail - INICIANDO');
    console.log('📧 Email solicitado:', email);
    console.log('═'.repeat(60));

    const result = await this.fetchData('getUserRole', { email });
    console.log('📥 getUserByEmail - Resultado COMPLETO:', JSON.stringify(result, null, 2));

    // Verificar estrutura do resultado
    if (!result) {
      console.error('❌ Resultado é null ou undefined');
      return null;
    }

    if (!result.success) {
      console.error('❌ result.success é false');
      console.error('   Error:', result.error);
      return null;
    }

    if (!result.data) {
      console.error('❌ result.data é null ou undefined');
      console.error('   Isso significa que getUserRole retornou { role: null, user: null }');
      console.error('   Possíveis causas:');
      console.error('   1. Email não encontrado na planilha USUARIOS');
      console.error('   2. Usuário está inativo');
      console.error('   3. Erro ao ler a planilha');
      return null;
    }

    // Google Apps Script retorna { success: true, data: { role: ..., user: {...} } }
    const userRoleData = result.data;
    console.log('📦 getUserByEmail - Data extraído:', JSON.stringify(userRoleData, null, 2));

    // Verificar se user existe em data
    if (!userRoleData.user) {
      console.error('❌ userRoleData.user não encontrado');
      console.error('   Data recebido:', JSON.stringify(userRoleData, null, 2));
      console.error('   Verifique se o usuário existe na planilha USUARIOS');
      console.error('   Email buscado:', email);
      return null;
    }

    const userData = userRoleData.user;
    console.log('👤 getUserByEmail - userData extraído:', JSON.stringify(userData, null, 2));

    const user = {
      id: userData.email,
      email: userData.email,
      name: userData.name || userData.nome || userData.email,
      role: userData.role,
      active: true,
      password: ''
    };

    console.log('✅ getUserByEmail - User FINAL:', JSON.stringify(user, null, 2));
    console.log('🎭 getUserByEmail - ROLE:', user.role, '(tipo:', typeof user.role, ')');
    console.log('═'.repeat(60));

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.fetchData('getUserRole', { email: id });
    console.log('📥 getUserById - Resultado COMPLETO:', JSON.stringify(result, null, 2));

    if (result && result.success && result.data) {
      // Google Apps Script retorna { success: true, data: { role: ..., user: {...} } }
      const userRoleData = result.data;
      console.log('📦 getUserById - Data extraído:', JSON.stringify(userRoleData, null, 2));

      // Extrair o objeto user de dentro de data
      const userData = userRoleData.user;

      if (!userData) {
        console.error('❌ getUserById - user não encontrado em data');
        return null;
      }

      console.log('👤 getUserById - userData extraído:', JSON.stringify(userData, null, 2));

      const user = {
        id: userData.email,
        email: userData.email,
        name: userData.name || userData.nome || userData.email,
        role: userData.role,
        active: true
      };

      console.log('✅ getUserById - User FINAL:', JSON.stringify(user, null, 2));
      console.log('🎭 getUserById - ROLE:', user.role, '(tipo:', typeof user.role, ')');

      return user;
    }

    console.error('❌ getUserById - Sem resultado válido');
    return null;
  }
}

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwbr9Vm-EJxPTxGEP12UtwWfeKTGU1LsCjnHxQzkY8a9AOOozLNeDKGcflIknT5_FOq/exec';
const sheetsService = new GoogleSheetsService(SCRIPT_URL);

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
        
        // Verificar se o usuário ainda existe/está ativo
        const freshUser = await sheetsService.getUserById(userData.id);
        
        if (freshUser && freshUser.active) {
          setUser(freshUser);
        } else {
          // Usuário não existe mais ou está inativo
          localStorage.removeItem('currentUser');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário armazenado:', error);
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
      console.log('🔐 INICIANDO LOGIN');
      console.log('═'.repeat(60));
      console.log('📧 Email:', email);

      const userData = await sheetsService.getUserByEmail(email.toLowerCase().trim());
      console.log('📥 Dados brutos do Google Sheets:', JSON.stringify(userData, null, 2));

      if (!userData) {
        throw new Error('Usuário não encontrado');
      }

      if (!userData.active) {
        throw new Error('Usuário inativo');
      }

      // CRÍTICO: Garantir que o role está limpo e em lowercase
      const cleanRole = String(userData.role).toLowerCase().trim();

      const userWithoutPassword: User = {
        id: userData.email,
        email: userData.email,
        name: userData.name,
        role: cleanRole as 'admin' | 'analista' | 'entrevistador',
        active: userData.active
      };

      console.log('═'.repeat(60));
      console.log('✅ USUÁRIO PROCESSADO');
      console.log('═'.repeat(60));
      console.log('User completo:', JSON.stringify(userWithoutPassword, null, 2));
      console.log('🎭 Role FINAL:', `"${userWithoutPassword.role}"`);
      console.log('📏 Tamanho:', userWithoutPassword.role.length);
      console.log('🔤 Tipo:', typeof userWithoutPassword.role);
      console.log('🔢 Bytes:', Array.from(userWithoutPassword.role).map(c => c.charCodeAt(0)).join(', '));
      console.log('');
      console.log('🧪 TESTES:');
      console.log('  role === "admin":', userWithoutPassword.role === 'admin');
      console.log('  role === "analista":', userWithoutPassword.role === 'analista');
      console.log('  role === "entrevistador":', userWithoutPassword.role === 'entrevistador');
      console.log('═'.repeat(60));

      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

      console.log('💾 Salvo no localStorage');
      console.log('═'.repeat(60));

    } catch (error) {
      console.error('❌ Erro no login:', error);
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

