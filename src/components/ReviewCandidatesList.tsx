import { useState, useEffect } from 'react';
import { Eye, Loader2 } from 'lucide-react';

interface Candidate {
  id: string;
  full_name?: string;
  nome_completo?: string;
  nome_social?: string;
  cpf?: string;
  cpf_numero?: string;
  email?: string;
  telefone?: string;
  desired_area?: string;
  area_atuacao_pretendida?: string;
  cargo_administrativo?: string | boolean;
  cargo_assistencial?: string | boolean;
  screening_notes?: string;
  screened_at?: string;
}

export default function ReviewCandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    loadReviewCandidates();
  }, []);

  async function loadReviewCandidates() {
    try {
      setLoading(true);
      const { googleSheetsService } = await import('../services/googleSheets');
      const result = await googleSheetsService.getCandidatesByStatus('Revisar');

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar candidatos');
      }

      setCandidates(result.data || []);
    } catch (error) {
      console.error('Erro ao carregar candidatos para revisão:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCargo(candidate: Candidate) {
    if (candidate.cargo_administrativo && candidate.cargo_administrativo !== 'false') {
      return typeof candidate.cargo_administrativo === 'string'
        ? candidate.cargo_administrativo
        : 'Administrativo';
    }
    if (candidate.cargo_assistencial && candidate.cargo_assistencial !== 'false') {
      return typeof candidate.cargo_assistencial === 'string'
        ? candidate.cargo_assistencial
        : 'Assistencial';
    }
    return 'Não informado';
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
        <Eye className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500">Nenhum candidato marcado para revisão</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Candidatos para Revisão</h2>
        <p className="text-sm text-gray-600 mt-1">
          {candidates.length} candidato(s) marcado(s) para revisão
        </p>
      </div>

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
                Área
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Data
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                  {candidate.nome_completo || candidate.full_name || 'Não informado'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {candidate.nome_social || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {candidate.area_atuacao_pretendida || candidate.desired_area || 'Não informado'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {getCargo(candidate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {candidate.cpf_numero || candidate.cpf || 'Não informado'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {candidate.email || 'Não informado'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {candidate.telefone || 'Não informado'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {candidate.screened_at
                    ? new Date(candidate.screened_at).toLocaleDateString('pt-BR')
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Detalhes do Candidato</h3>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Eye className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Nome Completo</p>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedCandidate.nome_completo || selectedCandidate.full_name}
                </p>
              </div>

              {selectedCandidate.nome_social && (
                <div>
                  <p className="text-sm text-gray-600">Nome Social</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedCandidate.nome_social}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">CPF</p>
                <p className="text-lg font-mono text-gray-800">
                  {selectedCandidate.cpf_numero || selectedCandidate.cpf}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Área</p>
                <p className="text-lg text-gray-800">
                  {selectedCandidate.area_atuacao_pretendida || selectedCandidate.desired_area}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Cargo Pretendido</p>
                <p className="text-lg text-gray-800">
                  {getCargo(selectedCandidate)}
                </p>
              </div>

              {selectedCandidate.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg text-gray-800">
                    {selectedCandidate.email}
                  </p>
                </div>
              )}

              {selectedCandidate.telefone && (
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="text-lg text-gray-800">
                    {selectedCandidate.telefone}
                  </p>
                </div>
              )}

              {selectedCandidate.screening_notes && (
                <div>
                  <p className="text-sm text-gray-600">Observações</p>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedCandidate.screening_notes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Marcado para revisão em</p>
                <p className="text-gray-800">
                  {selectedCandidate.screened_at
                    ? new Date(selectedCandidate.screened_at).toLocaleString('pt-BR')
                    : 'Não informado'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
