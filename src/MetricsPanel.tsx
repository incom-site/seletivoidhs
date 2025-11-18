import { useEffect, useState } from 'react';
import { SessionMetrics } from '../types/candidate';
import { TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle, User, RefreshCw } from 'lucide-react';
import { candidateService } from '../services/candidateService';

interface MetricsPanelProps {
  sessionMetrics?: SessionMetrics;
  showHistorical?: boolean;
  userEmail?: string; // Recebe o email como prop
}

interface HistoricalMetrics {
  totalReviewed: number;
  classified: number;
  disqualified: number;
  review: number;
  averageTimePerCandidate: number;
}

export default function MetricsPanel({ 
  sessionMetrics, 
  showHistorical = true,
  userEmail 
}: MetricsPanelProps) {
  const [historicalMetrics, setHistoricalMetrics] = useState<HistoricalMetrics>({
    totalReviewed: 0,
    classified: 0,
    disqualified: 0,
    review: 0,
    averageTimePerCandidate: 0
  });
  const [loading, setLoading] = useState(true);

  const metrics = showHistorical ? historicalMetrics : sessionMetrics;

  useEffect(() => {
    if (showHistorical && userEmail) {
      loadHistoricalMetrics();
    }
  }, [showHistorical, userEmail]);

  const loadHistoricalMetrics = async () => {
    try {
      setLoading(true);
      const stats = await candidateService.getStatistics(userEmail);

      const classified = stats.approved;
      const disqualified = stats.rejected;
      const review = stats.revisar;
      const totalReviewed = classified + disqualified + review;

      // Calcula tempo médio (exemplo - ajuste conforme seus dados)
      const averageTimePerCandidate = totalReviewed > 0 ? 
        Math.round((8 * 60) / totalReviewed) : 0;

      setHistoricalMetrics({
        totalReviewed,
        classified,
        disqualified,
        review,
        averageTimePerCandidate
      });
    } catch (error) {
      console.error('Erro ao carregar métricas históricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading && showHistorical) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="animate-pulse flex items-center justify-between">
          <div className="h-6 bg-blue-500 rounded w-32"></div>
          <div className="flex gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-blue-500 rounded w-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {showHistorical ? <User className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          <span className="font-semibold text-sm">
            {showHistorical ? 'Métricas do Usuário' : 'Métricas da Sessão'}
          </span>
          {showHistorical && userEmail && (
            <span className="text-xs opacity-80 ml-2">({userEmail})</span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 opacity-80" />
            <div className="text-right">
              <div className="text-xs opacity-80">Tempo médio</div>
              <div className="text-sm font-bold">
                {formatTime(metrics.averageTimePerCandidate)}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-blue-400 opacity-50" />

          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-300" />
            <div className="text-right">
              <div className="text-xs opacity-80">Classificados</div>
              <div className="text-sm font-bold">{metrics.classified}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-300" />
            <div className="text-right">
              <div className="text-xs opacity-80">Desclassificados</div>
              <div className="text-sm font-bold">{metrics.disqualified}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-300" />
            <div className="text-right">
              <div className="text-xs opacity-80">Revisar</div>
              <div className="text-sm font-bold">{metrics.review}</div>
            </div>
          </div>

          <div className="h-8 w-px bg-blue-400 opacity-50" />

          <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
            <div className="text-xs opacity-80">Total triados</div>
            <div className="text-2xl font-bold">{metrics.totalReviewed}</div>
          </div>

          {showHistorical && (
            <button
              onClick={loadHistoricalMetrics}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-1 text-xs font-medium transition-all"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
