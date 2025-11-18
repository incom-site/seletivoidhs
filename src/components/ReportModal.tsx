import { useState, useEffect } from 'react';
import { X, FileText, Users, BarChart, Filter, User } from 'lucide-react';
import { getAnalysts, getInterviewers } from '../services/userService';
import { User as UserType } from '../contexts/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateClassifiedReport: (filterType: string, filterValue: string) => void;
  onGenerateDisqualifiedReport: (filterType: string, filterValue: string) => void;
  onGenerateGeneralReport: (filterType: string, filterValue: string) => void;
}

export default function ReportModal({
  isOpen,
  onClose,
  onGenerateClassifiedReport,
  onGenerateDisqualifiedReport,
  onGenerateGeneralReport
}: ReportModalProps) {
  const [analysts, setAnalysts] = useState<UserType[]>([]);
  const [interviewers, setInterviewers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'analyst' | 'interviewer'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [analystsData, interviewersData] = await Promise.all([
        getAnalysts(),
        getInterviewers()
      ]);
      setAnalysts(analystsData);
      setInterviewers(interviewersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type: 'all' | 'analyst' | 'interviewer') => {
    setFilterType(type);
    setSelectedUser('');
  };

  const getUserList = () => {
    if (filterType === 'analyst') return analysts;
    if (filterType === 'interviewer') return interviewers;
    return [];
  };

  const getFilterValue = () => {
    if (filterType === 'all') return 'todos';
    return selectedUser;
  };

  const canGenerateReport = () => {
    if (filterType === 'all') return true;
    return selectedUser !== '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">Gerar Relatório</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Filtros */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Filtros de Relatório</h3>
            </div>

            {/* Tipo de Filtro */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Filtrar por:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    filterType === 'all'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <Users className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Todos</div>
                </button>
                <button
                  onClick={() => handleFilterChange('analyst')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    filterType === 'analyst'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Analista</div>
                </button>
                <button
                  onClick={() => handleFilterChange('interviewer')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    filterType === 'interviewer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <User className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Entrevistador</div>
                </button>
              </div>
            </div>

            {/* Seleção de Usuário */}
            {filterType !== 'all' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Selecione o {filterType === 'analyst' ? 'analista' : 'entrevistador'}:
                </label>
                {loading ? (
                  <div className="text-center py-4 text-slate-500">
                    Carregando...
                  </div>
                ) : (
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {getUserList().map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {!canGenerateReport() && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Selecione um {filterType === 'analyst' ? 'analista' : 'entrevistador'} para gerar o relatório
                </p>
              </div>
            )}
          </div>

          {/* Tipos de Relatório */}
          <div>
            <p className="text-slate-600 mb-4">
              Escolha o tipo de relatório que deseja gerar:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (canGenerateReport()) {
                    onGenerateGeneralReport(filterType, getFilterValue());
                    onClose();
                  }
                }}
                disabled={!canGenerateReport()}
                className={`w-full p-4 border-2 rounded-lg transition-all group ${
                  canGenerateReport()
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-300 cursor-pointer'
                    : 'bg-slate-100 border-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform ${
                    canGenerateReport() ? 'bg-blue-600 group-hover:scale-110' : 'bg-slate-400'
                  }`}>
                    <BarChart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Relatório Geral</h3>
                    <p className="text-sm text-slate-600">
                      Resumo completo com estatísticas, métricas e todos os candidatos organizados por status
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (canGenerateReport()) {
                    onGenerateClassifiedReport(filterType, getFilterValue());
                    onClose();
                  }
                }}
                disabled={!canGenerateReport()}
                className={`w-full p-4 border-2 rounded-lg transition-all group ${
                  canGenerateReport()
                    ? 'bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-300 cursor-pointer'
                    : 'bg-slate-100 border-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform ${
                    canGenerateReport() ? 'bg-green-600 group-hover:scale-110' : 'bg-slate-400'
                  }`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Apenas Classificados</h3>
                    <p className="text-sm text-slate-600">
                      Lista detalhada com nome, área, cargo e número de registro dos candidatos classificados
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (canGenerateReport()) {
                    onGenerateDisqualifiedReport(filterType, getFilterValue());
                    onClose();
                  }
                }}
                disabled={!canGenerateReport()}
                className={`w-full p-4 border-2 rounded-lg transition-all group ${
                  canGenerateReport()
                    ? 'bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-300 cursor-pointer'
                    : 'bg-slate-100 border-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform ${
                    canGenerateReport() ? 'bg-red-600 group-hover:scale-110' : 'bg-slate-400'
                  }`}>
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Apenas Desclassificados</h3>
                    <p className="text-sm text-slate-600">
                      Lista detalhada com nome, área, cargo e número de registro dos candidatos desclassificados
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
