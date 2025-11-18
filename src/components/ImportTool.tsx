import { useState, useEffect } from 'react';
import { Candidate } from '../types/candidate';
import { processMultipleUrls } from '../services/jotformService';
import {
  FileText,
  GraduationCap,
  CreditCard,
  Award,
  FolderOpen,
  ExternalLink,
  AlertCircle,
  User,
  Stethoscope
} from 'lucide-react';

interface DocumentViewerProps {
  candidate: Candidate;
  onFocusDocument?: (docKey: string) => void;
}

interface Document {
  key: string;
  label: string;
  url?: string;
  icon: React.ReactNode;
  isPrimary?: boolean;
}

export default function DocumentViewer({ candidate, onFocusDocument }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  // Mapeamento dos documentos baseado nas colunas exatas da sua planilha
  const documents: Document[] = [
    { 
      key: 'curriculo', 
      label: 'Currículo Vitae', 
      url: candidate.CURRICULOVITAE,
      icon: <FileText className="w-5 h-5" />, 
      isPrimary: true 
    },
    { 
      key: 'documentos_pessoais', 
      label: 'Documentos Pessoais', 
      url: candidate.DOCUMENTOSPESSOAIS,
      icon: <User className="w-5 h-5" />, 
      isPrimary: true 
    },
    { 
      key: 'diploma', 
      label: 'Diploma/Certificado', 
      url: candidate.DIPLOMACERTIFICADO,
      icon: <GraduationCap className="w-5 h-5" />, 
      isPrimary: true 
    },
    { 
      key: 'documentos_profissionais', 
      label: 'Documentos Profissionais', 
      url: candidate.DOCUMENTOSPROFISSIONAIS,
      icon: <FolderOpen className="w-5 h-5" /> 
    },
    { 
      key: 'documentos_conselho', 
      label: 'Documentos do Conselho', 
      url: candidate.DOCUMENTOSCONSELHO,
      icon: <CreditCard className="w-5 h-5" />,
      isPrimary: candidate.AREAATUACAO === 'Assistencial' 
    },
    { 
      key: 'cursos_especializacoes', 
      label: 'Cursos e Especializações', 
      url: candidate.ESPECIALIZACOESCURSOS,
      icon: <Award className="w-5 h-5" /> 
    },
    { 
      key: 'laudo_medico', 
      label: 'Laudo Médico', 
      url: candidate['LAUDO MEDICO'],
      icon: <Stethoscope className="w-5 h-5" /> 
    }
  ];

  // Filtra documentos disponíveis (com URL)
  const availableDocs = documents.filter(doc => 
    doc.url && doc.url.trim() !== '' && doc.url !== 'N/A' && doc.url !== 'Não possui'
  );

  useEffect(() => {
    if (availableDocs.length > 0 && !selectedDoc) {
      // Prioriza documentos primários
      const primaryDocs = availableDocs.filter(d => d.isPrimary);
      if (primaryDocs.length > 0) {
        setSelectedDoc(primaryDocs[0].key);
      } else {
        setSelectedDoc(availableDocs[0].key);
      }
    }
  }, [candidate.CPF, availableDocs]);

  const handleDocumentSelect = (docKey: string) => {
    setSelectedDoc(docKey);
    onFocusDocument?.(docKey);
  };

  const selectedDocument = availableDocs.find(d => d.key === selectedDoc);
  const processedFiles = selectedDocument?.url ? processMultipleUrls(selectedDocument.url) : [];

  // Função para obter ícone baseado no tipo de arquivo
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'image':
        return <Award className="w-5 h-5 text-green-600" />;
      case 'jotform':
        return <ExternalLink className="w-5 h-5 text-purple-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <FolderOpen className="w-5 h-5 text-slate-600" />;
    }
  };

  // Função para obter badge do tipo de arquivo
  const getFileTypeBadge = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return { label: 'PDF', color: 'bg-red-100 text-red-700' };
      case 'image':
        return { label: 'Imagem', color: 'bg-green-100 text-green-700' };
      case 'jotform':
        return { label: 'Jotform', color: 'bg-purple-100 text-purple-700' };
      case 'doc':
      case 'docx':
        return { label: 'Word', color: 'bg-blue-100 text-blue-700' };
      default:
        return { label: 'Arquivo', color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-200">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-800">Documentos do Candidato</h2>
          <p className="text-sm text-slate-600 mt-1">
            {candidate.AREAATUACAO} • {candidate.CARGOPRETENDIDO} • {availableDocs.length} documento(s) disponível(s)
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDocs.map((doc) => (
            <button
              key={doc.key}
              onClick={() => handleDocumentSelect(doc.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all whitespace-nowrap ${
                selectedDoc === doc.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
              } ${doc.isPrimary ? 'font-semibold border-blue-300' : ''}`}
            >
              {doc.icon}
              <span className="text-sm">{doc.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Área principal de visualização */}
      <div className="flex-1 p-4 overflow-hidden">
        {selectedDocument ? (
          <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
            <div className="p-6 flex-shrink-0 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {selectedDocument.icon}
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedDocument.label}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {processedFiles.length} arquivo(s) encontrado(s)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Container dos arquivos com rolagem */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {processedFiles.map((file, idx) => {
                  const fileTypeBadge = getFileTypeBadge(file.type);
                  
                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-slate-700">
                              {processedFiles.length > 1 ? `Arquivo ${idx + 1}` : selectedDocument.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${fileTypeBadge.color}`}>
                              {fileTypeBadge.label}
                            </span>
                          </div>
                          
                          <div className="bg-white p-3 rounded border border-slate-200 mb-3">
                            <a
                              href={file.displayUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all font-mono"
                            >
                              {file.displayUrl}
                            </a>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <a
                              href={file.displayUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Abrir link
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(file.displayUrl);
                                alert('Link copiado para a área de transferência!');
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              Copiar link
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {processedFiles.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-lg font-medium mb-2">Nenhum arquivo encontrado</p>
                  <p className="text-sm">O link pode estar vazio ou inválido</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-lg py-12">
            <FolderOpen className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-500 mb-2">Nenhum documento disponível</p>
            <p className="text-sm text-slate-400">Este candidato não possui documentos cadastrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
