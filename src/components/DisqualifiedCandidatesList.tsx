import { useState, useEffect } from 'react';
import { XCircle, Loader2, RefreshCw } from 'lucide-react';

interface Candidate {
  id: string;
  registration_number?: string;
  NOMECOMPLETO?: string;
  full_name?: string;
  nome_completo?: string;
  nome_social?: string;
  CPF?: string;
  cpf?: string;
  cpf_numero?: string;
  email?: string;
  telefone?: string;
  AREAATUACAO?: string;
  desired_area?: string;
  area_atuacao_pretendida?: string;
  CARGOPRETENDIDO?: string;
  cargo_administrativo?: string | boolean;
  cargo_assistencial?: string | boolean;
  status?: string;
  status_triagem?: string;
  screening_notes?: string;
  observacoes_triagem?: string;
  screened_at?: string;
  data_hora_triagem?: string;
  assigned_at?: string;
  assigned_to?: string;
  // Motivos possíveis (vamos cobrir TODOS os casos)
  'Motivo Desclassificação'?: string;
  motivo_desclassificacao?: string;
  disqualification_reason?: string | { reason: string };
  observacoes?: string; // pode vir nas observações com [Motivo automático]
  analista_triagem?: string;
}

export default function DisqualifiedCandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    loadDisqualifiedCandidates();
  }, []);

  async function loadDisqualifiedCandidates() {
    try {
      setLoading(true);
      const { googleSheetsService } = await import('../services/googleSheets');
      const result = await googleSheetsService.getCandidatesByStatus('Desclassificado');

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar candidatos');
      }

      const candidatesData = result.data || [];
      setCandidates(candidatesData);
      console.log('Candidatos desclassificados carregados:', candidatesData.length);
    } catch (error) {
      console.error('Erro ao carregar candidatos desclassificados:', error);
    } finally {
      setLoading(false);
    }
  }

  // FUNÇÃO MELHORADA: busca o motivo em TODOS os lugares possíveis
  function getMotivoDesclassificacao(candidate: Candidate): string {
    // 1. Coluna principal (a que usamos no saveScreening)
    if (candidate['Motivo Desclassificação']) return candidate['Motivo Desclassificação'].trim();
    if (candidate.motivo_desclassificacao) return candidate.motivo_desclassificacao.trim();

    // 2. Outros formatos antigos
    if (typeof candidate.disqualification_reason === 'string') return candidate.disqualification_reason.trim();
    if (candidate.disqualification_reason?.reason) return candidate.disqualification_reason.reason.trim();

    // 3. Motivo automático nas observações (NOSSO NOVO PADRÃO!)
    const obs = candidate.observacoes_triagem || candidate.screening_notes || candidate.observacoes || '';
    const match = obs.match(/\[Motivo automático\]\s*(.+?)(?:\n|$)/i);
    if (match) return match[1].trim();

    // 4. Fallback final
    return 'Motivo não informado';
  }

  function getNomeCompleto(c: Candidate) {
    return c.NOMECOMPLETO || c.nome_completo || c.full_name || 'Nome não informado';
  }

  function getAreaAtuacao(c: Candidate) {
    return c.AREAATUACAO || c.area_atuacao_pretendida || c.desired_area || 'Área não informada';
  }

  function getCargo(c: Candidate) {
    return c.CARGOPRETENDIDO || c.cargo_administrativo || c.cargo_assistencial || 'Não informado';
  }

  function getDataTriagem(c: Candidate) {
    return c.assigned_at || c.data_hora_triagem || c.screened_at || null;
  }

  function getAnalistaTriagem(c: Candidate) {
    return c.assigned_to || c.analista_triagem || 'Analista não informado';
  }

  function getObservacoes(c: Candidate) {
    return c.observacoes_triagem || c.screening_notes || null;
  }

  function formatarData(dataString: string | null) {
    if (!dataString) return '-';
    try {
      return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataString;
    }
  }

  function formatarDataCurta(dataString: string | null) {
    if (!dataString) return '-';
    try {
      return new Date(dataString).toLocaleDateString('pt-BR');
    } catch {
      return dataString;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando candidatos desclassificados...</span>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <XCircle className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-2">Nenhum candidato desclassificado</p>
        <p className="text-gray-400 text-sm">
          Os candidatos aparecerão aqui quando forem desclassificados pelos analistas
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Candidatos Desclassificados</h2>
          <p className="text-sm text-gray-600 mt-1">
            {candidates.length} candidato(s) desclassificado(s)
          </p>
        </div>
        <button
          onClick={loadDisqualifiedCandidates}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome Completo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CPF</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Área</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Motivo da Desclassificação</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data da Triagem</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Analista</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {candidates.map((c) => (
              <tr key={c.id || c.registration_number} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                  {getNomeCompleto(c)}
                  {c.nome_social && <div className="text-xs text-gray-500">({c.nome_social})</div>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {c.CPF || c.cpf || c.cpf_numero || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{getAreaAtuacao(c)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{getCargo(c)}</td>
                <td className="px-4 py-3 text-sm text-gray-800 max-w-xs">
                  <div className="font-medium text-red-700 bg-red-50 px-2 py-1 rounded" title={getMotivoDesclassificacao(c)}>
                    {getMotivoDesclassificacao(c)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatarDataCurta(getDataTriagem(c))}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{getAnalistaTriagem(c)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedCandidate(c)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b bg-red-50">
              <h3 className="text-2xl font-bold text-red-800">Candidato Desclassificado</h3>
              <button onClick={() => setSelectedCandidate(null)}>
                <XCircle className="w-8 h-8 text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Nome Completo</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{getNomeCompleto(selectedCandidate)}</p>
                  {selectedCandidate.nome_social && (
                    <p className="text-sm text-gray-600 mt-1">Nome social: {selectedCandidate.nome_social}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">CPF</p>
                  <p className="text-xl font-mono text-gray-900 mt-1">
                    {selectedCandidate.CPF || selectedCandidate.cpf || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <p className="text-lg font-bold text-red-800 mb-3">Motivo da Desclassificação</p>
                <p className="text-xl font-semibold text-red-900 leading-relaxed">
                  {getMotivoDesclassificacao(selectedCandidate)}
                </p>
              </div>

              {getObservacoes(selectedCandidate) && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Observações do Analista</p>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-gray-800">
                    {getObservacoes(selectedCandidate)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-6 pt-6 border-t">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Data da Triagem</p>
                  <p className="text-lg text-gray-900">{formatarData(getDataTriagem(selectedCandidate))}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Área Pretendida</p>
                  <p className="text-lg text-gray-900">{getAreaAtuacao(selectedCandidate)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Analista Responsável</p>
                  <p className="text-lg text-gray-900">{getAnalistaTriagem(selectedCandidate)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium"
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
