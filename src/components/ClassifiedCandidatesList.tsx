import { useState, useEffect } from 'react';
import { CheckCircle, Mail, MessageSquare, Loader2, Send, Calendar, RefreshCw } from 'lucide-react';
import MessagingModal from './MessagingModal';
import type { Candidate } from '../types/candidate';

function isMessageSent(value: any): boolean {
  return value === true || value === 'Sim' || value === 'TRUE' || value === 'true';
}

export default function ClassifiedCandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    loadClassifiedCandidates();
  }, []);

  async function loadClassifiedCandidates() {
    try {
      setLoading(true);
      const { googleSheetsService } = await import('../services/googleSheets');

      console.log('🚀 Iniciando busca por candidatos classificados...');
      const result = await googleSheetsService.getCandidatesByStatus('Classificado');

      console.log('📊 Resultado completo:', JSON.stringify(result, null, 2));
      console.log('✅ result.success:', result.success);
      console.log('📦 result.data:', result.data);
      console.log('📦 Tipo de result.data:', typeof result.data);
      console.log('📦 É array?', Array.isArray(result.data));

      if (!result.success) {
        console.error('❌ Erro retornado:', result.error);
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

      console.log('📋 Candidatos extraídos:', candidatesData);
      console.log('📏 Total:', candidatesData.length);

      if (candidatesData.length > 0) {
        console.log('👤 Primeiro candidato:', JSON.stringify(candidatesData[0], null, 2));
        console.log('🔑 Campos:', Object.keys(candidatesData[0]));
      }

      setCandidates(candidatesData);
    } catch (error) {
      console.error('❌ Erro ao carregar candidatos classificados:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
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

  function getSelectedCandidatesData() {
    return candidates.filter(c => selectedCandidates.has(c.id));
  }

  async function handleMoveToInterview() {
    const selected = getSelectedCandidatesData();

    console.log('🔍 Candidatos selecionados:', selected);
    console.log('🔍 Verificando status de mensagens...');
    selected.forEach(c => {
      console.log(`  - ${c.NOMECOMPLETO}:`, {
        email_sent: c.email_sent,
        email_sent_type: typeof c.email_sent,
        sms_sent: c.sms_sent,
        sms_sent_type: typeof c.sms_sent
      });
    });

    const withMessages = selected.filter(c => {
      const hasEmail = isMessageSent(c.email_sent);
      const hasSms = isMessageSent(c.sms_sent);
      return hasEmail || hasSms;
    });

    console.log('✅ Candidatos com mensagens:', withMessages.length);

    if (withMessages.length === 0) {
      alert('Selecione apenas candidatos que já receberam email ou SMS');
      return;
    }

    if (withMessages.length !== selected.length) {
      const diff = selected.length - withMessages.length;
      if (!confirm(`${diff} candidato(s) selecionado(s) ainda não receberam mensagens. Deseja continuar apenas com os ${withMessages.length} que receberam?`)) {
        return;
      }
    }

    try {
      setAllocating(true);
      const { googleSheetsService } = await import('../services/googleSheets');

      const candidateIds = withMessages.map(c => c.registration_number).join(',');
      const result = await googleSheetsService.moveToInterview(candidateIds);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao mover para entrevista');
      }

      alert(`${withMessages.length} candidato(s) movido(s) para entrevista com sucesso!`);
      setSelectedCandidates(new Set());
      loadClassifiedCandidates();
    } catch (error) {
      console.error('Erro ao mover para entrevista:', error);
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
        <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500">Nenhum candidato classificado ainda</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Candidatos Classificados</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedCandidates.size > 0
              ? `${selectedCandidates.size} candidato(s) selecionado(s)`
              : `${candidates.length} candidato(s) classificado(s)`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadClassifiedCandidates}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          {selectedCandidates.size > 0 && (
            <>
              <button
                onClick={() => setShowMessagingModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar Mensagens
              </button>
              <button
                onClick={handleMoveToInterview}
                disabled={allocating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {allocating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                Mover para Entrevista
              </button>
            </>
          )}
        </div>
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
                Status Mensagens
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
                    {candidate.AREAATUACAO || 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {candidate.CARGOPRETENDIDO || 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {candidate.CPF || 'Não informado'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {email ? (
                      <a href={`mailto:${email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {email}
                      </a>
                    ) : (
                      'Não informado'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {telefone || 'Não informado'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isMessageSent(candidate.email_sent) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          <Mail className="w-3 h-3" />
                          Email enviado
                        </span>
                      )}
                      {isMessageSent(candidate.sms_sent) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          <MessageSquare className="w-3 h-3" />
                          SMS enviado
                        </span>
                      )}
                      {!isMessageSent(candidate.email_sent) && !isMessageSent(candidate.sms_sent) && (
                        <span className="text-xs text-gray-400">Nenhuma mensagem enviada</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <MessagingModal
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
        candidates={getSelectedCandidatesData()}
        onMessagesSent={() => {
          setSelectedCandidates(new Set());
          setShowMessagingModal(false);
          loadClassifiedCandidates();
        }}
      />
    </div>
  );
}
