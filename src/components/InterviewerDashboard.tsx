import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import type { Candidate } from '../types/candidate';
import InterviewEvaluationForm from './InterviewEvaluationForm';

export default function InterviewerDashboard() {
  const { user, logout } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    loadMyCandidates();
  }, [user]);

  async function loadMyCandidates() {
    try {
      setLoading(true);
      const { googleSheetsService } = await import('../services/googleSheets');

      const result = await googleSheetsService.getInterviewerCandidates(user?.email || '');

      if (!result.success) {
        console.error('Erro:', result.error);
        return;
      }

      let candidatesData: Candidate[] = [];
      if (Array.isArray(result.data)) {
        candidatesData = result.data;
      } else if (result.data && typeof result.data === 'object') {
        if (Array.isArray((result.data as any).candidates)) {
          candidatesData = (result.data as any).candidates;
        }
      }

      setCandidates(candidatesData);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleStartInterview(candidate: Candidate) {
    setSelectedCandidate(candidate);
  }

  function handleCloseEvaluation() {
    setSelectedCandidate(null);
  }

  function handleSaveEvaluation() {
    setSelectedCandidate(null);
    loadMyCandidates();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Painel do Entrevistador</h1>
              <p className="text-sm text-gray-600">Entrevistador: {user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Sair
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-800">Candidatos Alocados</div>
              <div className="text-2xl font-bold text-blue-800">{candidates.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-800">Avaliados</div>
              <div className="text-2xl font-bold text-green-800">
                {candidates.filter(c => c.interview_completed_at).length}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-800">Pendentes</div>
              <div className="text-2xl font-bold text-yellow-800">
                {candidates.filter(c => !c.interview_completed_at).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <ClipboardCheck className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum candidato alocado para entrevista</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nome Completo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nome Social
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Cargo Pretendido
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    PCD
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      {candidate.NOMECOMPLETO || 'Não informado'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {candidate.NOMESOCIAL || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {candidate.CPF || 'Não informado'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {candidate.CARGOPRETENDIDO || 'Não informado'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {candidate.VAGAPCD === 'Sim' ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Sim
                        </span>
                      ) : (
                        <span className="text-gray-400">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {candidate.interview_completed_at ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Avaliado
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!candidate.interview_completed_at ? (
                        <button
                          onClick={() => handleStartInterview(candidate)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Avaliar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Concluído</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCandidate && (
        <InterviewEvaluationForm
          candidate={selectedCandidate}
          onClose={handleCloseEvaluation}
          onSave={handleSaveEvaluation}
        />
      )}
    </div>
  );
}
