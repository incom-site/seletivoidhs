import { useState, useEffect } from 'react';
import { candidateService, Candidate } from '../services/candidateService';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle, Clock, AlertCircle, XCircle, Eye, ClipboardCheck } from 'lucide-react';
import DocumentViewer from './DocumentViewer';
import ScreeningModal from './ScreeningModal';

interface AnalystDashboardProps {
  onCandidateTriaged?: () => void;
}

export default function AnalystDashboard({ onCandidateTriaged }: AnalystDashboardProps) {
  console.log('📊 AnalystDashboard RENDERIZADO - Este é o painel de ANALISTA');
  const { user, logout } = useAuth();
  console.log('👤 AnalystDashboard - Usuário:', user);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pendente: 0,
    em_analise: 0,
    concluido: 0,
    classificado: 0,
    desclassificado: 0,
    revisar: 0,
  });

  useEffect(() => {
    if (user) {
      loadCandidates();
      loadStats();
    }
  }, [user]);

  async function loadCandidates() {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔄 Carregando candidatos para analista:', user.id);
      
      const response = await candidateService.getCandidates(1, 100, {
        assignedTo: user.id,
      });
      
      console.log('📊 Candidatos carregados:', response.data);
      setCandidates(response.data);
      
      if (response.data.length > 0 && !selectedCandidate) {
        setSelectedCandidate(response.data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    if (!user) return;

    try {
      const data = await candidateService.getStatistics(user.id);
      console.log('📈 Estatísticas carregadas:', data);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }

  async function handleScreeningComplete() {
    try {
      await loadCandidates();
      await loadStats();

      if (onCandidateTriaged) {
        onCandidateTriaged();
      }

      moveToNext();
    } catch (error) {
      console.error('Erro ao recarregar dados após triagem:', error);
    }
  }

  async function handleReview() {
    if (!selectedCandidate || !user) return;

    try {
      console.log('🔍 Marcando para revisão:', selectedCandidate.registration_number);

      const { googleSheetsService } = await import('../services/googleSheets');
      const result = await googleSheetsService.updateCandidateStatus(
        selectedCandidate.registration_number,
        'Revisar',
        {
          analystEmail: user.email
        }
      );

      console.log('📝 Resposta da revisão:', result);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao marcar para revisão');
      }

      await loadCandidates();
      await loadStats();

      if (onCandidateTriaged) {
        onCandidateTriaged();
      }

      alert('Candidato marcado para revisão!');
      moveToNext();
    } catch (error) {
      console.error('Erro ao marcar candidato para revisão:', error);
      alert('Erro ao marcar candidato para revisão: ' + error.message);
    }
  }

  function moveToNext() {
    if (!selectedCandidate) return;
    const currentIndex = candidates.findIndex(c => c.id === selectedCandidate.id);
    if (currentIndex < candidates.length - 1) {
      setSelectedCandidate(candidates[currentIndex + 1]);
    }
  }

  function moveToPrevious() {
    if (!selectedCandidate) return;
    const currentIndex = candidates.findIndex(c => c.id === selectedCandidate.id);
    if (currentIndex > 0) {
      setSelectedCandidate(candidates[currentIndex - 1]);
    }
  }

  // Função para traduzir o status para exibição
  function getStatusDisplay(status: string) {
    const statusMap: { [key: string]: string } = {
      'pendente': 'Pendente',
      'em_analise': 'Em Análise',
      'concluido': 'Concluído',
      'classificada': 'Classificado',
      'desclassificada': 'Desclassificado',
      'revisar': 'Revisar'
    };
    
    return statusMap[status] || status;
  }

  // Função para obter a cor do status
  function getStatusColor(status: string) {
    const colorMap: { [key: string]: string } = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'em_analise': 'bg-blue-100 text-blue-800',
      'concluido': 'bg-green-100 text-green-800',
      'classificada': 'bg-green-100 text-green-800',
      'desclassificada': 'bg-red-100 text-red-800',
      'revisar': 'bg-orange-100 text-orange-800'
    };
    
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-y-auto">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Meus Candidatos</h1>
            <p className="text-sm text-gray-600">Analista: {user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-800 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Pendentes
            </div>
            <div className="text-2xl font-bold text-blue-800">{stats.pendente}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-800 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Em Análise
            </div>
            <div className="text-2xl font-bold text-purple-800">{stats.em_analise}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-800 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Concluídos
            </div>
            <div className="text-2xl font-bold text-green-800">{stats.concluido}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="text-sm text-emerald-800 flex items-center gap-1">
              <ClipboardCheck className="w-4 h-4" />
              Classificados
            </div>
            <div className="text-2xl font-bold text-emerald-800">{stats.classificado}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm text-red-800 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              Desclassificados
            </div>
            <div className="text-2xl font-bold text-red-800">{stats.desclassificado}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r overflow-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Lista de Candidatos</h2>
            <div className="space-y-2">
              {candidates.map(candidate => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedCandidate?.id === candidate.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-800 text-sm">{candidate.NOMECOMPLETO || candidate.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {candidate.registration_number}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(candidate.status)}`}
                    >
                      {getStatusDisplay(candidate.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedCandidate ? (
            <>
              <div className="flex-1 overflow-auto">
                <DocumentViewer candidate={selectedCandidate} />
              </div>

              <div className="bg-white border-t p-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={moveToPrevious}
                      disabled={!selectedCandidate || candidates.findIndex(c => c.id === selectedCandidate.id) === 0}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={moveToNext}
                      disabled={!selectedCandidate || candidates.findIndex(c => c.id === selectedCandidate.id) === candidates.length - 1}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      Próximo
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowScreeningModal(true)}
                      disabled={!selectedCandidate}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Iniciar Triagem
                    </button>
                    <button
                      onClick={handleReview}
                      disabled={!selectedCandidate}
                      className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Revisar
                    </button>
                  </div>
                </div>
              </div>

              {selectedCandidate && (
                <ScreeningModal
                  isOpen={showScreeningModal}
                  onClose={() => setShowScreeningModal(false)}
                  candidate={selectedCandidate}
                  onScreeningComplete={handleScreeningComplete}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Selecione um candidato para visualizar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
