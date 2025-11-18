import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, BarChart3, Eye, RefreshCw } from 'lucide-react';
import { candidateService } from '../services/candidateService';

interface StatsPanelProps {
  analystEmail?: string;
  showOnlyAnalyst?: boolean;
}

export default function StatsPanel({ analystEmail, showOnlyAnalyst = false }: StatsPanelProps) {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    revisar: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [analystEmail, showOnlyAnalyst]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getStatistics(
        showOnlyAnalyst ? analystEmail : undefined
      );
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  const getProgressPercentage = () => {
    if (stats.total === 0) return 0;
    const reviewed = stats.total - stats.pending;
    return Math.round((reviewed / stats.total) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="animate-pulse grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800">
          {showOnlyAnalyst ? `Estatísticas - ${analystEmail}` : 'Estatísticas Gerais'}
        </h2>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-800">Total</span>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
              <span>Progresso</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Aprovados */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-green-800">Aprovados</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
          <p className="text-xs text-green-700 mt-2">{getPercentage(stats.approved)}%</p>
        </div>

        {/* Reprovados */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-red-800">Reprovados</span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
          <p className="text-xs text-red-700 mt-2">{getPercentage(stats.rejected)}%</p>
        </div>

        {/* Revisar */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-800">Revisar</span>
            <Eye className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">{stats.revisar}</p>
          <p className="text-xs text-purple-700 mt-2">{getPercentage(stats.revisar)}%</p>
        </div>

        {/* Pendentes */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-amber-800">Pendentes</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-900">{stats.pending}</p>
          <p className="text-xs text-amber-700 mt-2">{getPercentage(stats.pending)}%</p>
        </div>
      </div>
    </div>
  );
}
