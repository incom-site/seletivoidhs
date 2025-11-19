export interface Candidate {
  id: string;
  registration_number: string;
  NOMECOMPLETO: string;
  name?: string;
  NOMESOCIAL?: string;
  CPF: string;
  VAGAPCD: string;
  'LAUDO MEDICO'?: string;
  AREAATUACAO: string;
  CARGOADMIN?: string;
  CARGOASSIS?: string;
  CURRICULOVITAE?: string;
  DOCUMENTOSPESSOAIS?: string;
  DOCUMENTOSPROFISSIONAIS?: string;
  DIPLOMACERTIFICADO?: string;
  DOCUMENTOSCONSELHO?: string;
  ESPECIALIZACOESCURSOS?: string;

  status: 'pendente' | 'em_analise' | 'concluido';
  assigned_to?: string;
  assigned_at?: string;
  assigned_by?: string;
  priority?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CandidateFilters {
  status?: string;
  AREAATUACAO?: string;
  search?: string;
  assignedTo?: string;
  CARGOADMIN?: string;
  CARGOASSIS?: string;
  VAGAPCD?: string;
}

class GoogleSheetsService {
  private scriptUrl: string;

  constructor() {
    this.scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwRZ7vLEm4n8iha2GJSnIfCEjhHejRLme-OkIkp_qu6/dev';
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
          url.searchParams.append(key, data[key]);
        });
      }

      console.log('🔄 Chamando Google Apps Script:', url.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
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

  async getCandidates(): Promise<Candidate[]> {
    console.log('📞 Chamando getCandidates do Google Sheets...');
    const result = await this.fetchData('getCandidates');
    console.log('📥 Resultado completo recebido:', result);
    console.log('📊 result.data:', result.data);
    console.log('📊 result.data?.candidates:', result.data?.candidates);

    // O Google Apps Script retorna { success: true, data: { candidates: [...] } }
    const candidatesArray = result.data?.candidates || result.candidates || [];
    console.log('✅ Array de candidatos extraído:', candidatesArray);
    console.log('📏 Total de candidatos:', candidatesArray.length);

    if (candidatesArray.length > 0) {
      console.log('👤 Exemplo do primeiro candidato:', candidatesArray[0]);
    }

    return candidatesArray.map((candidate: any, index: number) => {
      const cpf = candidate.CPF || candidate.cpf || '';
      const candidateId = cpf ? `CPF_${cpf.replace(/\D/g, '')}` : (candidate.id || `candidate_${index}_${Date.now()}`);

      const assignedToRaw = candidate.assigned_to || candidate.Analista || '';
      const assignedTo = (assignedToRaw && assignedToRaw.trim() !== '' && assignedToRaw !== 'null' && assignedToRaw !== 'undefined')
        ? assignedToRaw.trim()
        : null;

      const normalized: any = {
        ...candidate,
        id: candidateId,
        registration_number: candidate.CPF || candidate.registration_number,
        name: candidate.NOMECOMPLETO || candidate.name,
        NOMECOMPLETO: candidate.NOMECOMPLETO || candidate.name,
        CPF: candidate.CPF || candidate.cpf,
        AREAATUACAO: candidate.AREAATUACAO || candidate.area || candidate.Area,
        CARGOADMIN: candidate.CARGOADMIN || candidate.cargo_administrativo || null,
        CARGOASSIS: candidate.CARGOASSIS || candidate.cargo_assistencial || null,

        status: (candidate.Status || candidate.status || 'pendente').toLowerCase(),
        Status: candidate.Status || candidate.status || 'pendente',

        assigned_to: assignedTo,
        Analista: assignedTo,
        assigned_at: candidate.assigned_at || null,
        assigned_by: candidate.assigned_by || null,

        created_at: candidate.DataCadastro || candidate.created_at || null,
        updated_at: candidate.updated_at || null,
      };

      return normalized;
    });
  }

  async updateCandidate(cpf: string, updates: any): Promise<void> {
    await this.fetchData('updateCandidate', {
      candidateCPF: cpf,
      ...updates
    });
  }

  async deleteCandidate(cpf: string): Promise<void> {
    await this.fetchData('deleteCandidate', { candidateCPF: cpf });
  }

  async addCandidate(candidate: any): Promise<void> {
    await this.fetchData('addCandidate', candidate);
  }
}

const sheetsService = new GoogleSheetsService();

const filterData = (data: any[], filters?: CandidateFilters): any[] => {
  if (!filters) return data;

  return data.filter(item => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.AREAATUACAO && item.AREAATUACAO !== filters.AREAATUACAO) return false;
    if (filters.CARGOADMIN && item.CARGOADMIN !== filters.CARGOADMIN) return false;
    if (filters.CARGOASSIS && item.CARGOASSIS !== filters.CARGOASSIS) return false;
    if (filters.VAGAPCD && item.VAGAPCD !== filters.VAGAPCD) return false;
    if (filters.assignedTo && item.assigned_to !== filters.assignedTo) return false;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        item.NOMECOMPLETO,
        item.NOMESOCIAL,
        item.CPF,
        item.CARGOADMIN,
        item.CARGOASSIS,
        item.registration_number,
        item.name
      ];

      const hasMatch = searchableFields.some(field =>
        field && field.toString().toLowerCase().includes(searchTerm)
      );

      if (!hasMatch) return false;
    }

    return true;
  });
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const candidateService = {
  async getCandidates(
    page: number = 1,
    pageSize: number = 50,
    filters?: CandidateFilters,
    userId?: string
  ): Promise<PaginatedResponse<Candidate>> {
    try {
      console.log('📊 [CandidateService] Buscando candidatos...');
      console.log('📊 [CandidateService] UserId:', userId);
      console.log('📊 [CandidateService] Filters:', filters);

      const allData = await sheetsService.getCandidates();
      console.log('📦 [CandidateService] Total de candidatos carregados:', allData.length);

      if (allData.length > 0) {
        console.log('👤 [CandidateService] Exemplo de candidato:', allData[0]);
      }

      let filteredData = filterData(allData, filters);
      console.log('🔍 [CandidateService] Após filtros gerais:', filteredData.length);

      // CORREÇÃO: Verificar assigned_to considerando email e ID
      if (userId && filters?.assignedTo === undefined) {
        console.log('🔍 [CandidateService] Filtrando por userId:', userId);
        filteredData = filteredData.filter(item => {
          const match = item.assigned_to === userId ||
                        item.assigned_to === userId.toLowerCase() ||
                        item.Analista === userId ||
                        item.Analista === userId.toLowerCase();
          if (match) {
            console.log('✅ [CandidateService] Candidato encontrado:', item.NOMECOMPLETO, 'assigned_to:', item.assigned_to);
          }
          return match;
        });
        console.log('✅ [CandidateService] Após filtrar por userId:', filteredData.length);
      }

      filteredData.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = filteredData.slice(from, to);

      console.log('📄 [CandidateService] Página:', page, 'de', Math.ceil(filteredData.length / pageSize));
      console.log('📄 [CandidateService] Retornando:', paginatedData.length, 'candidatos');

      return {
        data: paginatedData,
        count: filteredData.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredData.length / pageSize),
      };
    } catch (error) {
      console.error('❌ [CandidateService] Erro ao buscar candidatos:', error);
      throw error;
    }
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    try {
      const allData = await sheetsService.getCandidates();
      return allData.find(item => item.id === id || item.CPF === id) || null;
    } catch (error) {
      console.error('Erro ao buscar candidato por ID:', error);
      throw error;
    }
  },

  async getCandidateByCPF(cpf: string): Promise<Candidate | null> {
    try {
      const allData = await sheetsService.getCandidates();
      return allData.find(item => item.CPF === cpf) || null;
    } catch (error) {
      console.error('Erro ao buscar candidato por CPF:', error);
      throw error;
    }
  },

  async getUnassignedCandidates(
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Candidate>> {
    try {
      console.log('🔍 [getUnassignedCandidates] Iniciando busca...');
      const allData = await sheetsService.getCandidates();
      console.log('📊 [getUnassignedCandidates] Total de candidatos:', allData.length);

      const unassignedData = allData.filter(item => {
        const assignedTo = item.assigned_to || item.Analista;
        const isUnassigned = !assignedTo || assignedTo === '' || assignedTo === 'null' || assignedTo === 'undefined';
        if (isUnassigned && allData.indexOf(item) < 3) {
          console.log(`✅ Candidato não alocado [${allData.indexOf(item) + 1}]:`, item.NOMECOMPLETO, '| assigned_to:', item.assigned_to, '| Analista:', item.Analista);
        }
        return isUnassigned;
      });
      console.log('📊 [getUnassignedCandidates] Candidatos não alocados:', unassignedData.length);

      // Verificar IDs duplicados
      const ids = unassignedData.map(c => c.id);
      const uniqueIds = new Set(ids);
      console.log('🔍 [getUnassignedCandidates] Total de IDs:', ids.length);
      console.log('🔍 [getUnassignedCandidates] IDs únicos:', uniqueIds.size);

      if (ids.length !== uniqueIds.size) {
        console.warn('⚠️ [getUnassignedCandidates] IDs DUPLICADOS DETECTADOS!');
        console.log('🔍 Primeiros 5 candidatos:');
        unassignedData.slice(0, 5).forEach((c, i) => {
          console.log(`  ${i + 1}. ID: ${c.id}, CPF: ${c.CPF}, Nome: ${c.NOMECOMPLETO}`);
        });
      }

      unassignedData.sort((a, b) => {
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });

      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedData = unassignedData.slice(from, to);

      console.log('📄 [getUnassignedCandidates] Retornando página', page, 'com', paginatedData.length, 'candidatos');

      return {
        data: paginatedData,
        count: unassignedData.length,
        page,
        pageSize,
        totalPages: Math.ceil(unassignedData.length / pageSize),
      };
    } catch (error) {
      console.error('Erro ao buscar candidatos não atribuídos:', error);
      throw error;
    }
  },

  async getStatistics(userId?: string) {
    try {
      const allData = await sheetsService.getCandidates();
      let filteredData = allData;

      if (userId) {
        filteredData = allData.filter(item => {
          const assignedTo = (item as any).assigned_to || (item as any).Analista;
          return assignedTo === userId;
        });
      }

      const getStatus = (candidate: any): string => {
        return candidate.Status || candidate.status || '';
      };

      const stats = {
        total: filteredData.length,
        pendente: filteredData.filter(c => {
          const status = getStatus(c);
          return !status || status === 'pendente' || status === '';
        }).length,
        em_analise: filteredData.filter(c => {
          const status = getStatus(c);
          return status === 'em_analise' || status === 'Em Análise';
        }).length,
        concluido: filteredData.filter(c => {
          const status = getStatus(c);
          return status === 'Classificado' || status === 'Desclassificado' ||
                 status === 'classificado' || status === 'desclassificado' ||
                 status === 'concluido';
        }).length,
        classificado: filteredData.filter(c => {
          const status = getStatus(c);
          return status === 'Classificado' || status === 'classificado';
        }).length,
        desclassificado: filteredData.filter(c => {
          const status = getStatus(c);
          return status === 'Desclassificado' || status === 'desclassificado';
        }).length,
        revisar: filteredData.filter(c => {
          const status = getStatus(c);
          return status === 'Revisar' || status === 'revisar';
        }).length,
        administrativa: filteredData.filter(c => c.AREAATUACAO === 'Administrativa').length,
        assistencial: filteredData.filter(c => c.AREAATUACAO === 'Assistencial').length,
        pcd: filteredData.filter(c => c.VAGAPCD === 'Sim').length,
        nao_pcd: filteredData.filter(c => c.VAGAPCD === 'Não').length,
      };

      return stats;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      throw error;
    }
  },

  async updateCandidateStatus(
    id: string,
    status: 'pendente' | 'em_analise' | 'concluido',
    notes?: string
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updates.notes = notes;
      }

      await sheetsService.updateCandidate(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar status do candidato:', error);
      throw error;
    }
  },

  async assignCandidate(
    id: string,
    assignedTo: string,
    assignedBy: string
  ): Promise<void> {
    try {
      const updates = {
        assigned_to: assignedTo,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString(),
        status: 'em_analise',
        updated_at: new Date().toISOString(),
      };

      await sheetsService.updateCandidate(id, updates);
    } catch (error) {
      console.error('Erro ao atribuir candidato:', error);
      throw error;
    }
  },

  async unassignCandidate(id: string): Promise<void> {
    try {
      const updates = {
        assigned_to: null,
        assigned_by: null,
        assigned_at: null,
        status: 'pendente',
        updated_at: new Date().toISOString(),
      };

      await sheetsService.updateCandidate(id, updates);
    } catch (error) {
      console.error('Erro ao remover atribuição do candidato:', error);
      throw error;
    }
  },

  async createCandidate(candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>): Promise<Candidate> {
    try {
      const newCandidate = {
        ...candidate,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await sheetsService.addCandidate(newCandidate);
      return newCandidate;
    } catch (error) {
      console.error('Erro ao criar candidato:', error);
      throw error;
    }
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
    try {
      const fullUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      await sheetsService.updateCandidate(id, fullUpdates);

      const allData = await sheetsService.getCandidates();
      const updatedCandidate = allData.find(item => item.id === id || item.CPF === id);

      if (!updatedCandidate) {
        throw new Error('Candidato não encontrado após atualização');
      }

      return updatedCandidate;
    } catch (error) {
      console.error('Erro ao atualizar candidato:', error);
      throw error;
    }
  },

  async deleteCandidate(id: string): Promise<void> {
    try {
      await sheetsService.deleteCandidate(id);
    } catch (error) {
      console.error('Erro ao deletar candidato:', error);
      throw error;
    }
  },

  async getAreas(): Promise<string[]> {
    try {
      const allData = await sheetsService.getCandidates();
      const uniqueAreas = [...new Set(allData.map(c => c.AREAATUACAO))];
      return uniqueAreas.filter(area => area && area.trim() !== '');
    } catch (error) {
      console.error('Erro ao buscar áreas:', error);
      throw error;
    }
  },

  async getCargos(): Promise<string[]> {
    try {
      const allData = await sheetsService.getCandidates();
      const uniqueCargos = [...new Set(allData.flatMap(c => [c.CARGOADMIN, c.CARGOASSIS].filter(Boolean)))];
      return uniqueCargos.filter(cargo => cargo && cargo.trim() !== '');
    } catch (error) {
      console.error('Erro ao buscar cargos:', error);
      throw error;
    }
  },

  async getVagaPCDOptions(): Promise<string[]> {
    try {
      const allData = await sheetsService.getCandidates();
      const uniqueOptions = [...new Set(allData.map(c => c.VAGAPCD))];
      return uniqueOptions.filter(option => option && option.trim() !== '');
    } catch (error) {
      console.error('Erro ao buscar opções PCD:', error);
      throw error;
    }
  },

  async searchCandidates(query: string): Promise<Candidate[]> {
    try {
      const allData = await sheetsService.getCandidates();
      const searchTerm = query.toLowerCase();

      return allData.filter(item => {
        const searchableFields = [
          item.NOMECOMPLETO,
          item.NOMESOCIAL,
          item.CPF,
          item.CARGOADMIN,
          item.CARGOASSIS,
          item.registration_number,
          item.name
        ];

        return searchableFields.some(field =>
          field && field.toString().toLowerCase().includes(searchTerm)
        );
      }).slice(0, 10);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      throw error;
    }
  }
};

