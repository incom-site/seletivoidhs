import { CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, LogOut, FileText, User, Briefcase, FileCheck, FileSearch, GraduationCap, Users, FolderOpen } from 'lucide-react';

interface ActionPanelProps {
  onClassify: () => void;
  onDisqualify: () => void;
  onReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLogout: () => void;
  onGenerateReport: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  hasPrevious: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCandidates: number;
  analystEmail: string;
  candidateName?: string;
  candidateArea?: string;
  candidateCargo?: string;
  candidateData?: any; // Dados do candidato para verificar quais abas mostrar
}

export default function ActionPanel({
  onClassify,
  onDisqualify,
  onReview,
  onPrevious,
  onNext,
  onLogout,
  onGenerateReport,
  onTabChange,
  activeTab,
  hasPrevious,
  hasNext,
  currentIndex,
  totalCandidates,
  analystEmail,
  candidateName,
  candidateArea,
  candidateCargo,
  candidateData
}: ActionPanelProps) {
  // Definir todas as abas possíveis com seus ícones e colunas correspondentes
  const allTabs = [
    { 
      id: 'info', 
      label: 'Informações Pessoais', 
      icon: User,
      columns: ['NOMECOMPLETO', 'NOMESOCIAL', 'CPF', 'VAGAPCD', 'LAUDOMEDICO']
    },
    { 
      id: 'area-cargo', 
      label: 'Área e Cargo', 
      icon: Briefcase,
      columns: ['AREAATUACAO', 'CARGOPRETENDIDO']
    },
    { 
      id: 'curriculo', 
      label: 'Currículo', 
      icon: FileSearch,
      columns: ['CURRICULOVITAE']
    },
    { 
      id: 'documentos-pessoais', 
      label: 'Documentos Pessoais', 
      icon: Users,
      columns: ['DOCUMENTOSPESSOAIS']
    },
    { 
      id: 'documentos-profissionais', 
      label: 'Documentos Profissionais', 
      icon: FolderOpen,
      columns: ['DOCUMENTOSPROFISSIONAIS']
    },
    { 
      id: 'diplomas-certificados', 
      label: 'Diplomas/Certificados', 
      icon: GraduationCap,
      columns: ['DIPLOMACERTIFICADO']
    },
    { 
      id: 'documentos-conselho', 
      label: 'Documentos do Conselho', 
      icon: FileCheck,
      columns: ['DOCUMENTOSCONSELHO']
    },
    { 
      id: 'especializacoes-cursos', 
      label: 'Especializações/Cursos', 
      icon: FileText,
      columns: ['ESPECIALIZACOESCURSOS']
    },
    { 
      id: 'sistema', 
      label: 'Sistema', 
      icon: FileCheck,
      columns: ['Status', 'DataCadastro']
    }
  ];

  // Filtrar abas que devem ser mostradas (apenas se houver dados nas colunas correspondentes)
  const visibleTabs = allTabs.filter(tab => {
    if (!candidateData) return false;
    
    // Para abas de informações pessoais e área/cargo, sempre mostrar (são básicas)
    if (tab.id === 'info' || tab.id === 'area-cargo') return true;
    
    // Para as demais abas, verificar se há dados nas colunas correspondentes
    return tab.columns.some(column => 
      candidateData[column] !== undefined && 
      candidateData[column] !== null && 
      candidateData[column] !== ''
    );
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Atalhos de teclado para as abas visíveis
    if (e.ctrlKey || e.metaKey) {
      const visibleTabIds = visibleTabs.map(tab => tab.id);
      const keyIndex = parseInt(e.key) - 1;
      
      if (keyIndex >= 0 && keyIndex < visibleTabIds.length) {
        e.preventDefault();
        onTabChange(visibleTabIds[keyIndex]);
      }
    }
  };

  const getTabShortcut = (tabId: string) => {
    const index = visibleTabs.findIndex(tab => tab.id === tabId);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 shadow-lg" onKeyDown={handleKeyPress}>
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Informações do Analista e Candidato */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-700">
                {analystEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">{analystEmail}</div>
              <div className="text-xs text-slate-500">
                Candidato {currentIndex + 1} de {totalCandidates}
              </div>
            </div>
          </div>

          {candidateName && (
            <div className="h-8 w-px bg-slate-300" />
          )}

          {candidateName && (
            <div className="max-w-xs">
              <div className="text-sm font-medium text-slate-800 truncate" title={candidateName}>
                {candidateName}
              </div>
              <div className="text-xs text-slate-500 flex gap-2">
                {candidateArea && <span>{candidateArea}</span>}
                {candidateCargo && candidateArea && <span>•</span>}
                {candidateCargo && <span>{candidateCargo}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Navegação entre candidatos */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-lg transition-colors font-medium"
            title="Anterior (←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="text-sm text-slate-600 min-w-20 text-center">
            {currentIndex + 1} / {totalCandidates}
          </div>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-lg transition-colors font-medium"
            title="Próximo (→)"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Abas - Scroll horizontal para muitas abas */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 flex-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const shortcut = getTabShortcut(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                }`}
                title={`${tab.label} ${shortcut ? `(Ctrl+${shortcut})` : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                {shortcut && (
                  <span className="bg-slate-200 bg-opacity-50 px-1.5 py-0.5 rounded text-xs hidden lg:inline">
                    {shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClassify}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-md hover:shadow-lg"
            title="Classificar (1)"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Classificar</span>
            <span className="bg-green-700 bg-opacity-50 px-1.5 py-0.5 rounded text-xs">1</span>
          </button>

          <button
            onClick={onDisqualify}
            className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold shadow-md hover:shadow-lg"
            title="Desclassificar (2)"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Desclassificar</span>
            <span className="bg-red-700 bg-opacity-50 px-1.5 py-0.5 rounded text-xs">2</span>
          </button>

          <button
            onClick={onReview}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-semibold shadow-md hover:shadow-lg"
            title="Marcar para Revisar (3)"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Revisar</span>
            <span className="bg-yellow-700 bg-opacity-50 px-1.5 py-0.5 rounded text-xs">3</span>
          </button>
        </div>
      </div>

      {/* Barra inferior com atalhos e ações gerais */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span><kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">1</kbd> Classificar</span>
            <span><kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">2</kbd> Desclassificar</span>
            <span><kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">3</kbd> Revisar</span>
            <span><kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">←</kbd> <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">→</kbd> Navegar</span>
            
            {/* Atalhos dinâmicos para abas visíveis */}
            {visibleTabs.slice(0, 4).map((tab, index) => (
              <span key={tab.id}>
                <kbd className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono">Ctrl+{index + 1}</kbd> {tab.label}
              </span>
            ))}
            
            {visibleTabs.length > 4 && (
              <span className="text-slate-500">+{visibleTabs.length - 4} mais...</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            title="Gerar Relatório"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">Relatório</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
