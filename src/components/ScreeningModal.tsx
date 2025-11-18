import { useState } from 'react';
import { X, Check, FileText, Award, Briefcase, User, Car, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Candidate {
  id: string;
  full_name?: string;
  NOMECOMPLETO?: string;
  registration_number?: string;
  CPF?: string;
  NOMESOCIAL?: string;
  AREAATUACAO?: string;
  CARGOPRETENDIDO?: string;
  VAGAPCD?: string;
}

interface ScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onScreeningComplete: () => void;
}

interface DocumentCheck {
  name: string;
  key: string;
  value: 'conforme' | 'nao_conforme' | 'nao_se_aplica';
  required?: boolean;
  icon?: React.ReactNode;
}

interface TechnicalEvaluation {
  capacidade_tecnica: number;
  experiencia: number;
}

export default function ScreeningModal({
  isOpen,
  onClose,
  candidate,
  onScreeningComplete
}: ScreeningModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'documents' | 'technical' | 'result'>('documents');
  const [loading, setLoading] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState('');
  
  // Estado para documentos obrigatórios
  const [documents, setDocuments] = useState<DocumentCheck[]>([
    { name: 'RG e CPF', key: 'checkrg-cpf', value: 'nao_se_aplica', required: true, icon: <User className="w-4 h-4" /> },
    { name: 'CNH', key: 'check-cnh', value: 'nao_se_aplica', icon: <Car className="w-4 h-4" /> },
    { name: 'Comprovação de Experiência Profissional', key: 'check-experiencia', value: 'nao_se_aplica', required: true, icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Regularidade Profissional', key: 'check-regularidade', value: 'nao_se_aplica', icon: <Award className="w-4 h-4" /> },
    { name: 'Laudo médico (PCD)', key: 'check-laudo', value: 'nao_se_aplica', icon: <Stethoscope className="w-4 h-4" /> },
    { name: 'Currículo atualizado', key: 'check-curriculo', value: 'nao_se_aplica', required: true, icon: <FileText className="w-4 h-4" /> }
  ]);

  // Estado para avaliação técnica
  const [technicalEvaluation, setTechnicalEvaluation] = useState<TechnicalEvaluation>({
    capacidade_tecnica: 0,
    experiencia: 0
  });

  const [classification, setClassification] = useState<'classificado' | 'desclassificado' | null>(null);
  const [notes, setNotes] = useState('');

  // ✅ FUNÇÃO SIMPLIFICADA: Usar serviço HTTP
  const submitScreening = async (classificationStatus: 'classificado' | 'desclassificado') => {
    setLoading(true);

    try {
      console.log('═══════════════════════════════════════');
      console.log('🚀 INICIANDO TRIAGEM');
      console.log('═══════════════════════════════════════');
      console.log('📊 Status enviado:', classificationStatus);
      console.log('👤 Candidato ID:', candidate.id);
      console.log('📝 Registro:', candidate.registration_number);
      console.log('🆔 CPF:', candidate.CPF);

      // ✅ Preparar dados dos documentos
      const documentsData = documents.reduce((acc, doc) => {
        acc[doc.key] = doc.value;
        return acc;
      }, {} as Record<string, string>);

      console.log('📋 Documentos avaliados:');
      Object.entries(documentsData).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });

      // ✅ Preparar dados de triagem
      const screeningData: any = {
        candidateId: candidate.id,
        registrationNumber: candidate.registration_number,
        cpf: candidate.CPF,
        status: classificationStatus,
        analystEmail: user?.email || 'unknown@example.com',
        screenedAt: new Date().toISOString(),
        notes: notes || '',
        ...documentsData
      };

      // ✅ Motivo de desclassificação
      if (classificationStatus === 'desclassificado') {
        screeningData.disqualification_reason = disqualificationReason || '';
        console.log('❌ Motivo desclassificação:', screeningData.disqualification_reason);
      }

      // ✅ Avaliação técnica
      if (classificationStatus === 'classificado') {
        screeningData.capacidade_tecnica = technicalEvaluation.capacidade_tecnica;
        screeningData.experiencia = technicalEvaluation.experiencia;
        console.log('✅ Avaliação técnica:', {
          capacidade: screeningData.capacidade_tecnica,
          experiencia: screeningData.experiencia
        });
      }

      console.log('═══════════════════════════════════════');
      console.log('📤 DADOS COMPLETOS A ENVIAR:');
      console.log(JSON.stringify(screeningData, null, 2));
      console.log('═══════════════════════════════════════');

      // ✅ Usar serviço HTTP do Google Sheets
      const { googleSheetsService } = await import('../services/googleSheets');
      const result = await googleSheetsService.saveScreening(screeningData);

      console.log('═══════════════════════════════════════');
      console.log('📥 RESPOSTA DO SERVIDOR:');
      console.log(JSON.stringify(result, null, 2));
      console.log('═══════════════════════════════════════');

      if (result.success) {
        console.log('✅ SUCESSO! Status retornado:', result.status);
        alert(`Triagem salva com sucesso!\nStatus: ${result.status || classificationStatus}`);
        onScreeningComplete();
        handleClose();
      } else {
        console.error('❌ ERRO DO SERVIDOR:', result.error);
        alert(`Erro ao salvar: ${result.error || 'Erro desconhecido'}`);
      }

    } catch (error) {
      console.error('═══════════════════════════════════════');
      console.error('❌ ERRO CRÍTICO:', error);
      console.error('═══════════════════════════════════════');
      alert(`Erro ao salvar triagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar avaliação técnica
  const updateTechnicalEvaluation = (field: keyof TechnicalEvaluation, value: number) => {
    setTechnicalEvaluation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funções auxiliares
  const getDisqualificationReason = (): string => {
    const problematicDocs = documents.filter(doc => doc.value === 'nao_conforme');
    if (problematicDocs.length > 0) {
      return `Documentos obrigatórios não conformes: ${problematicDocs.map(d => d.name).join(', ')}`;
    }
    return disqualificationReason || 'Desclassificado por documento obrigatório não conforme';
  };

  const formatNotes = (classificationStatus: 'classificado' | 'desclassificado'): string => {
    const parts = [];
    
    const documentResults = documents.map(doc => 
      `${doc.name}: ${formatDocumentValue(doc.value)}`
    ).join(' | ');
    
    parts.push(`VERIFICAÇÃO DOCUMENTAL: ${documentResults}`);
    
    if (classificationStatus === 'desclassificado') {
      parts.push(`MOTIVO DESCLASSIFICAÇÃO: ${getDisqualificationReason()}`);
    }
    
    if (notes.trim()) {
      parts.push(`OBSERVAÇÕES: ${notes}`);
    }

    if (classificationStatus === 'classificado') {
      parts.push(`AVALIAÇÃO TÉCNICA: Capacidade ${technicalEvaluation.capacidade_tecnica}/10 + Experiência ${technicalEvaluation.experiencia}/10 = Total ${technicalEvaluation.capacidade_tecnica + technicalEvaluation.experiencia}/20`);
    }
    
    return parts.join('\n');
  };

  const formatDocumentValue = (value: string): string => {
    switch (value) {
      case 'conforme': return 'CONFORME';
      case 'nao_conforme': return 'NÃO CONFORME';
      case 'nao_se_aplica': return 'NÃO SE APLICA';
      default: return value;
    }
  };

  if (!isOpen) return null;

  // Função para atualizar documento
  const updateDocument = (index: number, value: 'conforme' | 'nao_conforme' | 'nao_se_aplica') => {
    const newDocuments = [...documents];
    newDocuments[index].value = value;
    setDocuments(newDocuments);
  };

  // Função para verificar se há documentos não conformes
  const hasNonConformDocuments = () => {
    return documents.some(doc => doc.value === 'nao_conforme');
  };

  // Função para verificar se todos os documentos obrigatórios foram avaliados
  const allRequiredDocumentsEvaluated = () => {
    return documents
      .filter(doc => doc.required)
      .every(doc => doc.value !== 'nao_se_aplica');
  };

  // Função para classificar candidato
  const handleClassify = () => {
    if (!allRequiredDocumentsEvaluated()) {
      alert('Avalie todos os documentos obrigatórios antes de classificar.');
      return;
    }
    
    if (hasNonConformDocuments()) {
      alert('Não é possível classificar candidato com documentos não conformes.');
      return;
    }
    
    setClassification('classificado');
    setCurrentStep('technical');
  };

  // ✅ FUNÇÃO CORRIGIDA: Desclassificar candidato
  const handleDisqualify = async () => {
    if (!allRequiredDocumentsEvaluated()) {
      alert('Avalie todos os documentos obrigatórios antes de desclassificar.');
      return;
    }

    console.log('🎯 INICIANDO DESCLASSIFICAÇÃO...');
    console.log('📋 Documentos avaliados:', documents.map(d => ({ name: d.name, value: d.value })));
    console.log('📝 Motivo adicional:', disqualificationReason);
    
    // ✅ CORREÇÃO: Chama diretamente com o status correto
    await submitScreening('desclassificado');
  };

  // Função para concluir classificação
  const handleCompleteClassification = async () => {
    if (technicalEvaluation.capacidade_tecnica === 0 || technicalEvaluation.experiencia === 0) {
      alert('Avalie todos os critérios técnicos antes de concluir.');
      return;
    }
    
    await submitScreening('classificado');
  };

  // Função para fechar modal
  const handleClose = () => {
    setCurrentStep('documents');
    setDocuments([
      { name: 'RG e CPF', key: 'checkrg-cpf', value: 'nao_se_aplica', required: true, icon: <User className="w-4 h-4" /> },
      { name: 'CNH', key: 'check-cnh', value: 'nao_se_aplica', icon: <Car className="w-4 h-4" /> },
      { name: 'Comprovação de Experiência Profissional', key: 'check-experiencia', value: 'nao_se_aplica', required: true, icon: <Briefcase className="w-4 h-4" /> },
      { name: 'Regularidade Profissional', key: 'check-regularidade', value: 'nao_se_aplica', icon: <Award className="w-4 h-4" /> },
      { name: 'Laudo médico (PCD)', key: 'check-laudo', value: 'nao_se_aplica', icon: <Stethoscope className="w-4 h-4" /> },
      { name: 'Currículo atualizado', key: 'check-curriculo', value: 'nao_se_aplica', required: true, icon: <FileText className="w-4 h-4" /> }
    ]);
    setTechnicalEvaluation({
      capacidade_tecnica: 0,
      experiencia: 0
    });
    setClassification(null);
    setNotes('');
    setDisqualificationReason('');
    onClose();
  };

  // Funções para obter informações do candidato
  const getCandidateName = () => {
    return candidate.NOMECOMPLETO || candidate.full_name || 'Candidato';
  };

  const getNomeSocial = () => {
    return candidate.NOMESOCIAL || 'Não informado';
  };

  const getAreaAtuacao = () => {
    return candidate.AREAATUACAO || 'Não informado';
  };

  const getCargoPretendido = () => {
    return candidate.CARGOPRETENDIDO || 'Não informado';
  };

  const getVagaPCD = () => {
    return candidate.VAGAPCD === 'Sim' ? 'Sim' : 'Não';
  };

  // Renderizar step de documentos
  const renderDocumentsStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Verificação de Documentos</h3>
        <p className="text-sm text-blue-600">
          Avalie a conformidade dos documentos do candidato. Documentos obrigatórios não conformes resultam em desclassificação.
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((doc, index) => (
          <div key={index} className={`border rounded-lg p-4 ${
            doc.required ? 'border-red-200 bg-red-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {doc.icon}
                <label className="block text-sm font-medium text-gray-700">
                  {doc.name}
                </label>
              </div>
              {doc.required && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Obrigatório</span>
              )}
            </div>
            <div className="flex gap-4 flex-wrap">
              {[
                { value: 'conforme' as const, label: 'Conforme', color: 'green' },
                { value: 'nao_conforme' as const, label: 'Não Conforme', color: 'red' },
                { value: 'nao_se_aplica' as const, label: 'Não se Aplica', color: 'gray' }
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`document-${index}`}
                    value={option.value}
                    checked={doc.value === option.value}
                    onChange={() => updateDocument(index, option.value)}
                    className={`text-${option.color}-600 focus:ring-${option.color}-500`}
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Motivo da desclassificação */}
      {(hasNonConformDocuments() || disqualificationReason) && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-red-600" />
            <label className="block text-sm font-medium text-red-700">
              Motivo da Desclassificação
            </label>
          </div>
          <textarea
            value={disqualificationReason}
            onChange={(e) => setDisqualificationReason(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Descreva o motivo da desclassificação..."
          />
          {hasNonConformDocuments() && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Documentos obrigatórios não conformes detectados
            </p>
          )}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observações Gerais
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Adicione observações sobre a documentação..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleClose}
          disabled={loading}
          className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        
        <button
          onClick={handleDisqualify}
          disabled={loading || !allRequiredDocumentsEvaluated()}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              Desclassificar
            </>
          )}
        </button>
        
        <button
          onClick={handleClassify}
          disabled={loading || !allRequiredDocumentsEvaluated() || hasNonConformDocuments()}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Classificar
        </button>
      </div>

      {!allRequiredDocumentsEvaluated() && (
        <div className="text-center py-2">
          <p className="text-sm text-orange-600">
            ⚠️ Avalie todos os documentos obrigatórios antes de prosseguir
          </p>
        </div>
      )}

      {hasNonConformDocuments() && allRequiredDocumentsEvaluated() && (
        <div className="text-center py-2">
          <p className="text-sm text-red-600">
            ❌ Não é possível classificar candidato com documentos não conformes
          </p>
        </div>
      )}
    </div>
  );

  // Renderizar step de avaliação técnica
  const renderTechnicalStep = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 mb-2">Avaliação Técnica - Candidato Classificado</h3>
        <p className="text-sm text-green-600">
          Avalie o candidato nas categorias abaixo. Pontuação máxima: 20 pontos.
        </p>
      </div>

      {/* Capacidade Técnica */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          <label className="block text-sm font-medium text-gray-700">
            1. Capacidade técnica - currículo, pós-graduação, mestrado e/ou cursos profissionalizantes
          </label>
        </div>
        
        <div className="space-y-3">
          {[
            { value: 10, label: 'Excelente - Possui formação e cursos relevantes avançados' },
            { value: 7, label: 'Bom - Possui formação adequada e alguns cursos complementares' },
            { value: 3, label: 'Regular - Formação básica, poucos cursos complementares' },
            { value: 0, label: 'Insuficiente - Formação inadequada ou sem cursos relevantes' }
          ].map((option) => (
            <label key={option.value} className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
              <input
                type="radio"
                name="capacidade_tecnica"
                value={option.value}
                checked={technicalEvaluation.capacidade_tecnica === option.value}
                onChange={() => updateTechnicalEvaluation('capacidade_tecnica', option.value)}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">{option.value} pontos</span>
                <p className="text-sm text-gray-500">{option.label}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Experiência */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-green-600" />
          <label className="block text-sm font-medium text-gray-700">
            2. Experiência conforme currículo
          </label>
        </div>
        
        <div className="space-y-3">
          {[
            { value: 10, label: 'Excelente - Ampla experiência comprovada na área' },
            { value: 7, label: 'Bom - Experiência relevante e adequada ao cargo' },
            { value: 3, label: 'Regular - Experiência básica ou parcialmente relacionada' },
            { value: 0, label: 'Insuficiente - Sem experiência relevante' }
          ].map((option) => (
            <label key={option.value} className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
              <input
                type="radio"
                name="experiencia"
                value={option.value}
                checked={technicalEvaluation.experiencia === option.value}
                onChange={() => updateTechnicalEvaluation('experiencia', option.value)}
                className="mt-1 text-green-600 focus:ring-green-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">{option.value} pontos</span>
                <p className="text-sm text-gray-500">{option.label}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Resumo da pontuação */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Resumo da Pontuação</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Capacidade Técnica:</span>
            <span className="font-medium ml-2">{technicalEvaluation.capacidade_tecnica} pontos</span>
          </div>
          <div>
            <span className="text-gray-600">Experiência:</span>
            <span className="font-medium ml-2">{technicalEvaluation.experiencia} pontos</span>
          </div>
          <div className="col-span-2 border-t pt-2">
            <span className="text-gray-600 font-medium">Total:</span>
            <span className="font-bold text-blue-600 ml-2">
              {technicalEvaluation.capacidade_tecnica + technicalEvaluation.experiencia} / 20 pontos
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setCurrentStep('documents')}
          disabled={loading}
          className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          onClick={handleCompleteClassification}
          disabled={loading || technicalEvaluation.capacidade_tecnica === 0 || technicalEvaluation.experiencia === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Concluir Triagem
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho com informações completas do candidato */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Triagem de Candidato
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nome Completo:</span>
                <p className="text-gray-900">{getCandidateName()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Nome Social:</span>
                <p className="text-gray-900">{getNomeSocial()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Área Pretendida:</span>
                <p className="text-gray-900">{getAreaAtuacao()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Cargo Pretendido:</span>
                <p className="text-gray-900 font-semibold">{getCargoPretendido()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Vaga PCD:</span>
                <p className={`font-medium ${getVagaPCD() === 'Sim' ? 'text-red-600' : 'text-gray-900'}`}>
                  {getVagaPCD()}
                </p>
              </div>
              {candidate.registration_number && (
                <div>
                  <span className="font-medium text-gray-700">Inscrição:</span>
                  <p className="text-gray-900">{candidate.registration_number}</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 ml-4"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep === 'documents' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className={`w-16 h-1 ${
                currentStep === 'technical' || currentStep === 'result' 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep === 'technical' || currentStep === 'result'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                <Award className="w-4 h-4" />
              </div>
            </div>
          </div>

          {currentStep === 'documents' && renderDocumentsStep()}
          {currentStep === 'technical' && renderTechnicalStep()}
        </div>
      </div>
    </div>
  );
}
