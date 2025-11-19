import { User } from '../contexts/AuthContext';
import { googleSheetsService } from './googleSheets';

export interface AssignmentRequest {
  candidateIds: string[];
  analystId: string;
  adminId: string;
}

function normalizeRole(role: string): 'admin' | 'analista' | 'entrevistador' {
  const normalized = String(role || '').toLowerCase().trim();
  if (normalized === 'admin' || normalized === 'administrador') return 'admin';
  if (normalized === 'analista') return 'analista';
  if (normalized === 'entrevistador') return 'entrevistador';
  return 'analista';
}

export async function getUsers(): Promise<User[]> {
  try {
    const result = await googleSheetsService.fetchData('getAllUsers', {});
    if (result && result.success && result.users) {
      return result.users.map((user: any) => ({
        id: user.Email || user.email || user.id,
        email: user.Email || user.email,
        name: user.Nome || user.name,
        role: normalizeRole(user.Role || user.role),
        active: user.Ativo !== undefined ? user.Ativo : user.active,
        password: user.Password || user.password
      }));
    }
    return [];
  } catch (error) {
    console.error('❌ [UserService] Erro ao buscar usuários:', error);
    throw error;
  }
}

export async function getAnalysts(): Promise<User[]> {
  try {
    console.log('🔍 [UserService] Buscando analistas...');

    const result = await googleSheetsService.getAnalysts();

    if (!result || !result.success) {
      console.error('❌ [UserService] Erro ao buscar analistas:', result?.error);
      return [];
    }

    let analysts = [];

    if (result.data && result.data.analysts && Array.isArray(result.data.analysts)) {
      analysts = result.data.analysts;
    } else if (result.data && Array.isArray(result.data)) {
      analysts = result.data;
    } else if (result.analysts && Array.isArray(result.analysts)) {
      analysts = result.analysts;
    } else if (Array.isArray(result)) {
      analysts = result;
    }

    console.log(`📊 [UserService] ${analysts.length} analistas encontrados`);

    const mappedAnalysts = analysts.map((analyst: any) => ({
      id: analyst.id || analyst.Email || analyst.email,
      email: analyst.Email || analyst.email,
      name: analyst.Nome || analyst.name || 'Analista',
      role: normalizeRole(analyst.Role || analyst.role),
      active: analyst.Ativo !== undefined ? analyst.Ativo : (analyst.active !== false)
    }));

    return mappedAnalysts;
  } catch (error) {
    console.error('❌ [UserService] Erro ao buscar analistas:', error);
    return [];
  }
}

export async function getInterviewers(): Promise<User[]> {
  try {
    console.log('🎤 [UserService] Buscando entrevistadores...');

    const result = await googleSheetsService.getInterviewers();

    if (!result) {
      console.error('❌ [UserService] Resultado vazio');
      return [];
    }

    const interviewers = Array.isArray(result) ? result : [];

    console.log(`📊 [UserService] ${interviewers.length} entrevistadores encontrados`);

    return interviewers.map((interviewer: any) => ({
      id: interviewer.id || interviewer.email,
      email: interviewer.email,
      name: interviewer.name || 'Entrevistador',
      role: normalizeRole('entrevistador'),
      active: true
    }));
  } catch (error) {
    console.error('❌ [UserService] Erro ao buscar entrevistadores:', error);
    return [];
  }
}

export async function createUser(user: Omit<User, 'id' | 'active'>): Promise<User> {
  try {
    const result = await googleSheetsService.fetchData('createUser', user);
    return result.data || result;
  } catch (error) {
    console.error('❌ [UserService] Erro ao criar usuário:', error);
    throw error;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  try {
    const result = await googleSheetsService.fetchData('updateUser', { id, updates });
    return result.data || result;
  } catch (error) {
    console.error('❌ [UserService] Erro ao atualizar usuário:', error);
    throw error;
  }
}

export async function deactivateUser(id: string): Promise<void> {
  try {
    await googleSheetsService.fetchData('deactivateUser', { id });
  } catch (error) {
    console.error('❌ [UserService] Erro ao desativar usuário:', error);
    throw error;
  }
}

export async function assignCandidates(request: AssignmentRequest): Promise<void> {
  try {
    console.log('🔵 [UserService] Alocando candidatos:', request);

    const result = await googleSheetsService.fetchData('assignCandidates', {
      candidateIds: request.candidateIds.join(','),
      analystEmail: request.analystId,
      adminEmail: request.adminId
    });

    console.log('✅ [UserService] Alocação concluída:', result);

    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ [UserService] Erro ao atribuir candidatos:', error);
    throw error;
  }
}

export async function unassignCandidates(candidateIds: string[]): Promise<void> {
  try {
    await googleSheetsService.fetchData('unassignCandidates', { candidateIds });
  } catch (error) {
    console.error('❌ [UserService] Erro ao remover atribuição de candidatos:', error);
    throw error;
  }
}
