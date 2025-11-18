import { useState } from 'react';
import { Candidate } from '../types/candidate';
import { UserCheck, UserX, AlertTriangle, Clock, Search } from 'lucide-react';
import CandidateDetailView from './CandidateDetailView';

interface CandidateListProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  onSelectCandidate: (candidate: Candidate) => void;
  filterArea: string;
  filterCargo: string;
  filterStatus: string;
  filterNome: string;
  onFilterAreaChange: (area: string) => void;
  onFilterCargoChange: (cargo: string) => void;
  onFilterStatusChange: (status: string) => void;
  onFilterNomeChange: (nome: string) => void;
}

export default function CandidateList({
  candidates,
  selectedCandidate,
  onSelectCandidate,
  filterArea,
  filterCargo,
  filterStatus,
  filterNome,
  onFilterAreaChange,
  onFilterCargoChange,
  onFilterStatusChange,
  onFilterNomeChange
}: CandidateListProps) {
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);

  const filteredCandidates = candidates.filter(candidate => {
    // Filtro por área
    const areaMatch = filterArea === 'all' || candidate.AREAATUACAO === filterArea;
    
    // Filtro por cargo
    const cargoMatch = filterCargo === 'all' || candidate.CARGOPRETENDIDO === filterCargo;
    
    // Filtro por status
    const statusMatch = filterStatus === 'all' || 
                       (filterStatus === 'pending' && !candidate.Status) ||
                       candidate.Status === filterStatus;
    
    // Filtro por nome (busca parcial case insensitive)
    const nomeMatch = filterNome === '' || 
                     candidate.NOMECOMPLETO?.toLowerCase().includes(filterNome.toLowerCase()) ||
                     candidate.NOMESOCIAL?.toLowerCase().includes(filterNome.toLowerCase());

    return areaMatch && cargoMatch && statusMatch && nomeMatch;
  });

  // Obter áreas únicas para o filtro
  const areas = Array.from(new Set(
    candidates.map(c => c.AREAATUACAO).filter(Boolean)
  )).sort();

  // Obter cargos únicos para o filtro
  const cargos = Array.from(new Set(
    candidates.map(c => c.CARGOPRETENDIDO).filter(Boolean)
  )).sort();

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Classificado':
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'Desclassificado':
        return <UserX className="w-4 h-4 text-red-600" />;
      case 'Revisar':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Classificado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Desclassificado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Revisar':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    setDetailCandidate(candidate);
  };

  return (
    <>
      {detailCandidate && (
        <CandidateDetailView
          candidate={detailCandidate}
          onClose={() => setDetailCandidate(null)}
        />
      )}

      <div className="flex flex-col h-full bg-white border-r border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Candidatos ({filteredCandidates.length})
          </h2>

          <div className="space-y-3">
            {/* Filtro por Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Buscar por Nome
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={filterNome}
                  onChange={(e) => onFilterNomeChange(e.target.value)}
                  placeholder="Digite o nome completo ou social..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Filtro por Área */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Área de Atuação
              </label>
              <select
                value={filterArea}
                onChange={(e) => onFilterAreaChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Todas as Áreas</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Cargo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cargo Pretendido
              </label>
              <select
                value={filterCargo}
                onChange={(e) => onFilterCargoChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Todos os Cargos</option>
                {cargos.map(cargo => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="Classificado">Classificados</option>
                <option value="Desclassificado">Desclassificados</option>
                <option value="Revisar">Para Revisar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCandidates.map((candidate) => (
            <button
              key={candidate.CPF}
              onClick={() => handleCandidateClick(candidate)}
              className={`w-full p-4 text-left border-b border-slate-200 hover:bg-blue-50 transition-colors ${
                selectedCandidate?.CPF === candidate.CPF
                  ? 'bg-blue-100 border-l-4 border-l-blue-600'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm leading-tight">
                    {candidate.NOMECOMPLETO}
                  </h3>
                  {candidate.NOMESOCIAL && (
                    <p className="text-xs text-slate-500 mt-1">
                      Nome Social: {candidate.NOMESOCIAL}
                    </p>
                  )}
                </div>
                {getStatusIcon(candidate.Status)}
              </div>

              <div className="space-y-1">
                {candidate.AREAATUACAO && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Área:</span> {candidate.AREAATUACAO}
                  </p>
                )}
                {candidate.CARGOPRETENDIDO && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Cargo:</span> {candidate.CARGOPRETENDIDO}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  <span className="font-medium">CPF:</span> {candidate.CPF}
                </p>
                {candidate.VAGAPCD && candidate.VAGAPCD !== 'Não' && (
                  <p className="text-xs text-orange-600 font-medium">
                    ⚠️ Vaga PCD: {candidate.VAGAPCD}
                  </p>
                )}
              </div>

              {candidate.Status && (
                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(candidate.Status)}`}>
                  {candidate.Status}
                </div>
              )}
            </button>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">Nenhum candidato encontrado</p>
              <p className="text-xs mt-1">Tente ajustar os filtros</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
