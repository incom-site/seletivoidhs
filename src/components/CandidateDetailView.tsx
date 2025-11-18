import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface CandidateDetailViewProps {
  candidate: any;
  onClose: () => void;
}

export default function CandidateDetailView({ candidate, onClose }: CandidateDetailViewProps) {
  const [activeTab, setActiveTab] = useState('info');

  const isURL = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const renderValue = (value: any) => {
    if (!value) return <span className="text-gray-400 italic">Vazio</span>;

    const strValue = String(value);

    if (isURL(strValue)) {
      return (
        <a
          href={strValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 break-all"
        >
          {strValue}
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
        </a>
      );
    }

    return <span className="break-words">{strValue}</span>;
  };

  const formatLabel = (key: string): string => {
    const labelMap: { [key: string]: string } = {
      // Informações Pessoais
      NOMECOMPLETO: 'NOME COMPLETO',
      NOMESOCIAL: 'NOME SOCIAL',
      CPF: 'CPF',
      VAGAPCD: 'VAGA PCD',
      LAUDOMEDICO: 'LAUDO MÉDICO',
      
      // Área e Cargo
      AREAATUACAO: 'ÁREA DE ATUAÇÃO',
      CARGOPRETENDIDO: 'CARGO PRETENDIDO',
      
      // Documentos
      CURRICULOVITAE: 'CURRÍCULO VITAE',
      COPIARG: 'RG',
      COPIACPF: 'CPF',
      CNH: 'CNH',
      DIPLOMACERTIFICADO: 'DIPLOMA/CERTIFICADO',
      DOCUMENTOSCONSELHO: 'DOCUMENTOS DO CONSELHO',
      EXPERIENCIAPROFISSIONAL: 'EXPERIÊNCIA PROFISSIONAL',
    
      
      // Campos de sistema
      Status: 'STATUS',
      DataCadastro: 'DATA DE CADASTRO'
    };

    return labelMap[key] || key.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getFieldValue = (key: string): any => {
    if (candidate[key] !== undefined && candidate[key] !== null && candidate[key] !== '') {
      return candidate[key];
    }
    return null;
  };

  const createOrderedFields = (keys: string[]) => {
    return keys.map(key => ({
      key,
      label: formatLabel(key),
      value: getFieldValue(key)
    })).filter(field => field.value !== null);
  };

  // Definindo as seções com as NOVAS colunas
  const personalFields = createOrderedFields([
    'NOMECOMPLETO', 
    'NOMESOCIAL', 
    'CPF', 
    'VAGAPCD', 
    'LAUDOMEDICO'
  ]);

  const areaCargoFields = createOrderedFields([
    'AREAATUACAO',
    'CARGOPRETENDIDO'
  ]);

  const documentosFields = createOrderedFields([
    'CURRICULOVITAE',
    'COPIARG',
    'COPIACPF',
    'DIPLOMACERTIFICADO',
    'DOCUMENTOSCONSELHO',
    'EXPERIENCIAPROFISSIONAL'
  ]);

  const systemFields = createOrderedFields([
    'Status',
    'DataCadastro'
  ]);

  const tabs = [
    { id: 'info', label: 'Informações Pessoais', count: personalFields.length },
    { id: 'area-cargo', label: 'Área e Cargo', count: areaCargoFields.length },
    { id: 'documentos', label: 'Documentos', count: documentosFields.length },
    { id: 'sistema', label: 'Sistema', count: systemFields.length },
  ].filter(tab => tab.count > 0); // Mostra apenas abas com campos

  const getActiveFields = () => {
    switch (activeTab) {
      case 'info': return personalFields;
      case 'area-cargo': return areaCargoFields;
      case 'documentos': return documentosFields;
      case 'sistema': return systemFields;
      default: return [];
    }
  };

  const getCandidateName = () => {
    return candidate.NOMECOMPLETO || 'Candidato';
  };

  const getCandidateIdentifier = () => {
    return candidate.CPF ? `CPF: ${candidate.CPF}` : 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{getCandidateName()}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {getCandidateIdentifier()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {tabs.length > 0 ? (
          <>
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label} {tab.count > 0 && `(${tab.count})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {getActiveFields().map(field => (
                  <div key={field.key} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <dt className="text-sm font-semibold text-gray-700 mb-2">
                      {field.label}
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {renderValue(field.value)}
                    </dd>
                  </div>
                ))}

                {getActiveFields().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum campo disponível nesta seção</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-gray-500">
              <p>Nenhum dado disponível para este candidato</p>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
