import { useState, useEffect } from 'react';
import { Candidate } from '../services/supabaseClient';
import { candidateService } from '../services/candidateService';
import DocumentViewer from './DocumentViewer';
import { RefreshCw, AlertCircle, Upload, LogOut, ChevronLeft, ChevronRight, Zap, Users } from 'lucide-react';
import ScreeningPanel from './ScreeningPanel';
import StatsPanel from './StatsPanel';
import FilterBar from './FilterBar';
import ImportTool from './ImportTool';
import CandidateDetailView from './CandidateDetailView';

interface DashboardProps {
  sessionId: string;
  analystEmail: string;
  onLogout: () => void;
}

export default function PaginatedDashboard({ sessionId, analystEmail, onLogout }: DashboardProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50);
  const [filters, setFilters] = useState({
    status: 'pendente',
    AREAATUACAO: '',
    search: '',
    assignedTo: '',
    CARGOPRETENDIDO: '',
    VAGAPCD: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, [page, filters]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await candidateService.getCandidates(page, pageSize, filters);
      setCandidates(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.count);

      if (response.data.length > 0 && (!selectedCandidate || !response.data.find(c => c.id === selectedCandidate.id))) {
        setSelectedCandidate(response.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar candidatos');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetMyBatch = async () => {
    try {
      setLoadingBatch(true);
      const response = await candidateService.getUnassignedCandidates(1, 20);
      const batch = response.data;

      if (batch.length === 0) {
        alert('Não há candidatos pendentes disponíveis no momento.');
        return;
      }

      // Atribuir os candidatos ao analista atual
      for (const candidate of batch) {
        await candidateService.assignCandidate(candidate.id, analystEmail, analystEmail);
      }

      setFilters({ ...filters, assignedTo: analystEmail, status: 'pendente' });
      setPage(1);

      alert(`${batch.length} candidatos foram atribuídos a você!`);
    } catch (err: any) {
      alert('Erro ao buscar lote: ' + err.message);
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleNext = () => {
    const currentIndex = candidates.findIndex(c => c.id === selectedCandidate?.id);
    if (currentIndex < candidates.length - 1) {
      setSelectedCandidate(candidates[currentIndex + 1]);
    } else if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevious = () => {
    const currentIndex = candidates.findIndex(c => c.id === selectedCandidate?.id);
    if (currentIndex > 0) {
      setSelectedCandidate(candidates[currentIndex - 1]);
    } else if (page > 1) {
      setPage(page - 1);
    }
  };

  const currentIndex = candidates.findIndex(c => c.id === selectedCandidate?.id);

  // Mapear para o formato esperado pelo DocumentViewer
  const mapCandidateToDocumentViewerFormat = (c: Candidate) => ({
    registrationNumber: c.registration_number,
    name: c.NOMECOMPLETO,
    area: c.AREAATUACAO,
    status: c.status,
    
    // Documentos da planilha
    CURRICULOVITAE: c.CURRICULOVITAE,
    DOCUMENTOSPESSOAIS: c.DOCUMENTOSPESSOAIS,
    DOCUMENTOSPROFISSIONAIS: c.DOCUMENTOSPROFISSIONAIS,
    DIPLOMACERTIFICADO: c.DIPLOMACERTIFICADO,
    DOCUMENTOSCONSELHO: c.DOCUMENTOSCONSELHO,
    ESPECIALIZACOESCURSOS: c.ESPECIALIZACOESCURSOS,
    'LAUDO MEDICO': c['LAUDO MEDICO'],
    
    // Campos adicionais para compatibilidade
    NOMECOMPLETO: c.NOMECOMPLETO,
    NOMESOCIAL: c.NOMESOCIAL,
    CPF: c.CPF,
    VAGAPCD: c.VAGAPCD,
    AREAATUACAO: c.AREAATUACAO,
    CARGOPRETENDIDO: c.CARGOPRETENDIDO
  });

  return (
    <>
      {detailCandidate && (
        <CandidateDetailView
          candidate={detailCandidate}
          onClose={() => setDetailCandidate(null)}
        />
      )}

      <div className="flex flex-col min-h-screen bg-slate-100 overflow-y-auto">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sistema de Triagem</h1>
              <p className="text-sm text-slate-600">Analista: {analystEmail}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleGetMyBatch}
                disabled={loadingBatch}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                {loadingBatch ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Pegar Meu Lote
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                Importar
              </button>
              <button
                onClick={loadCandidates}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>

        <StatsPanel analystEmail={analystEmail} />
        <FilterBar filters={filters} onFilterChange={setFilters} />

        <div className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} de {totalCount}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, assignedTo: analystEmail })}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    filters.assignedTo === analystEmail
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3 h-3 inline mr-1" />
                  Meus candidatos
                </button>
                {filters.assignedTo && (
                  <button
                    onClick={() => setFilters({ ...filters, assignedTo: '' })}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Ver todos
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 px-2">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading && candidates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Carregando candidatos...</p>
            </div>
          </div>
        ) : error && candidates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Nenhum candidato encontrado</h2>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={() => setShowImport(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Importar Candidatos
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 flex-shrink-0 border-r border-slate-200 overflow-y-auto">
              <div className="p-4 space-y-2">
                {candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => setDetailCandidate(candidate)}
                    onDoubleClick={() => handleSelectCandidate(candidate)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedCandidate?.id === candidate.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-800 text-sm mb-1 truncate">
                      {candidate.NOMECOMPLETO}
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>{candidate.AREAATUACAO} • {candidate.CARGOPRETENDIDO}</div>
                      <div className="text-slate-500">#{candidate.registration_number}</div>
                      {candidate.VAGAPCD === 'Sim' && (
                        <div className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                          PCD
                        </div>
                      )}
                      {candidate.assigned_to && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Users className="w-3 h-3" />
                          <span className="truncate">{candidate.assigned_to}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedCandidate ? (
                <DocumentViewer
                  candidate={mapCandidateToDocumentViewerFormat(selectedCandidate)}
                  onFocusDocument={() => {}}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">Selecione um candidato para visualizar</p>
                </div>
              )}
            </div>

            {selectedCandidate && (
              <div className="w-96 flex-shrink-0">
                <ScreeningPanel
                  candidate={selectedCandidate}
                  analystEmail={analystEmail}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  hasNext={currentIndex < candidates.length - 1 || page < totalPages}
                  hasPrevious={currentIndex > 0 || page > 1}
                  onUpdate={loadCandidates}
                />
              </div>
            )}
          </div>
        )}

        {showImport && (
          <ImportTool
            onImportComplete={loadCandidates}
            onClose={() => setShowImport(false)}
          />
        )}
      </div>
    </>
  );
}
