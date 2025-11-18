import { useState, useEffect } from 'react';
import { Calendar, Loader2, UserPlus } from 'lucide-react';
import type { Candidate } from '../types/candidate';
import { useAuth } from '../contexts/AuthContext';

export default function InterviewCandidatesList() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');

  useEffect(() => {
    loadInterviewCandidates();
    loadInterviewers();
  }, []);

  async function loadInterviewCandidates() {
    try {
      setLoading(true);
      const { googleSheetsService } = await import('../services/googleSheets');

      const result = await googleSheetsService.getInterviewCandidates();

      if (!result.success) {
        console.error('Erro:', result.error);
        alert(`Erro ao carregar candidatos: ${result.error}`);
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
      console.error('Erro ao carregar candidatos para entrevista:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadInterviewers() {
    try {
      const { googleSheetsService } = await import('../services/googleSheets');
      const result = await googleSheetsService.getInterviewers();

      if (result.success && Array.isArray(result.data)) {
        setInterviewers(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar entrevistadores:', error);
    }
  }

  function toggleCandidate(id: string) {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  }

  function toggleAll() {
    if (selectedCandidates.size === candidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(candidates.map(c => c.id)));
    }
  }

  async function handleAllocate() {
    if (!selectedInterviewer) {
      alert('Selecione um entrevistador');
      return;
    }

    if (selectedCandidates.size === 0) {
      alert('Selecione pelo menos um candidato');
      return;
    }

    try {
      setAllocating(true);
      const { googleSheetsService } = await import('../services/googleSheets');

      const candidateIds = Array.from(selectedCandidates)
        .map(id => {
          const candidate = candidates.find(c => c.id === id);
          return candidate?.registration_number || id;
        })
        .join(',');

      const result = await googleSheetsService.allocateToInterviewer(
        candidateIds,
        selectedInterviewer,
        user?.email || 'admin'
      );

      if (!result.success) {
        throw new Error(result.error || 'Erro ao alocar candidatos');
      }

      alert(`${selectedCandidates.size} candidato(s) alocado(s) para entrevista com sucesso!`);
      setSelectedCandidates(new Set());
      setSelectedInterviewer('');
      loadInterviewCandidates();
    } catch (error) {
      console.error('Erro ao alocar candidatos:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setAllocating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500">Nenhum candidato para entrevista ainda</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Candidatos para Entrevista</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedCandidates.size > 0
              ? `${selectedCandidates.size} candidato(s) selecionado(s)`
              : `${candidates.length} candidato(s) aguardando alocação`}
          </p>
        </div>

        {selectedCandidates.size > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedInterviewer}
              onChange={(e) => setSelectedInterviewer(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione o entrevistador</option>
              {interviewers.map((interviewer) => (
                <option key={interviewer.email} value={interviewer.email}>
                  {interviewer.name || interviewer.nome || interviewer.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleAllocate}
              disabled={allocating || !selectedInterviewer}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {allocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Alocar para Entrevista
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCandidates.size === candidates.length && candidates.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Nome Completo
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Nome Social
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Cargo Pretendido
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                CPF
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Telefone
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {candidates.map((candidate) => {
              const email = (candidate as any).EMAIL || (candidate as any).Email || (candidate as any).email;
              const telefone = (candidate as any).TELEFONE || (candidate as any).Telefone || (candidate as any).telefone;

              return (
                <tr
                  key={candidate.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedCandidates.has(candidate.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                    {candidate.NOMECOMPLETO || 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {candidate.NOMESOCIAL || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {candidate.CARGOPRETENDIDO || 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {candidate.CPF || 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {email || 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {telefone || 'Não informado'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
