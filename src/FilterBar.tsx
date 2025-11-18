import { Search, Filter } from 'lucide-react';

interface FilterBarProps {
  filters: {
    status: string;
    area: string;
    flagged: boolean | undefined;
    search: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      status: 'pending',
      area: '',
      flagged: undefined,
      search: ''
    });
  };

  const hasActiveFilters = 
    filters.status !== 'pending' || 
    filters.area !== '' || 
    filters.search !== '' || 
    filters.flagged !== undefined;

  return (
    <div className="bg-white border-b border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-5 h-5" />
          <span className="font-semibold text-sm">Filtros:</span>
        </div>

        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou número..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="pending">Pendentes</option>
          <option value="">Todos os status</option>
          <option value="Aprovado">Aprovados</option>
          <option value="Reprovado">Reprovados</option>
          <option value="Revisar">Revisar</option>
        </select>

        <select
          value={filters.area}
          onChange={(e) => handleFilterChange('area', e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Todas as áreas</option>
          <option value="Administrativa">Administrativa</option>
          <option value="Assistencial">Assistencial</option>
        </select>

        <select
          value={filters.flagged === undefined ? 'all' : filters.flagged ? 'true' : 'false'}
          onChange={(e) => {
            const value = e.target.value === 'all' ? undefined : e.target.value === 'true';
            handleFilterChange('flagged', value);
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="all">Marcados/Não marcados</option>
          <option value="true">Apenas marcados</option>
          <option value="false">Apenas não marcados</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
