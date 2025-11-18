import { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Filter, Loader2, Users, UserX, ClipboardCheck, Search } from 'lucide-react';
import type { Candidate } from '../types/candidate';

interface ReportsPageProps {
  onClose: () => void;
}

type ReportType = 'classificados' | 'desclassificados' | 'entrevista_classificados' | 'entrevista_desclassificados';

interface Analyst {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ReportsPage({ onClose }: ReportsPageProps) {
  const [loading, setLoading] = useState(false);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [interviewers, setInterviewers] = useState<Analyst[]>([]);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('todos');
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>('todos');
  const [reportType, setReportType] = useState<ReportType>('classificados');
  const [reportData, setReportData] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stats, setStats] = useState({
    classificados: 0,
    desclassificados: 0,
    entrevistaClassificados: 0,
    entrevistaDesclassificados: 0
  });

  useEffect(() => {
    loadAnalystsAndInterviewers();
    loadStats();
  }, []);

  useEffect(() => {
    if (reportType) {
      loadReport();
    }
  }, [reportType, selectedAnalyst, selectedInterviewer]);

  async function loadAnalystsAndInterviewers() {
    try {
      console.log('🔄 Iniciando carregamento de analistas e entrevistadores...');

      const { googleSheetsService } = await import('../services/googleSheets');

      // Carregar analistas e entrevistadores
      const [analystsResult, interviewersResult] = await Promise.all([
        googleSheetsService.getAnalysts(),
        googleSheetsService.getInterviewers()
      ]);

      console.log('📊 Resultado analistas:', analystsResult);
      console.log('🎤 Resultado entrevistadores:', interviewersResult);

      // Processar analistas
      if (analystsResult.success && Array.isArray(analystsResult.data)) {
        const formattedAnalysts = analystsResult.data.map((analyst: any) => ({
          id: analyst.email || analyst.id,
          name: analyst.name || analyst.nome,
          email: analyst.email,
          role: analyst.role || 'analista'
        }));
        setAnalysts(formattedAnalysts);
        console.log('✅ Analistas carregados:', formattedAnalysts.length);
      } else {
        console.error('❌ Falha ao carregar analistas:', analystsResult);
        setAnalysts([]);
      }

      // Processar entrevistadores
      if (interviewersResult.success && Array.isArray(interviewersResult.data)) {
        const formattedInterviewers = interviewersResult.data.map((interviewer: any) => ({
          id: interviewer.email || interviewer.id,
          name: interviewer.name || interviewer.nome,
          email: interviewer.email,
          role: 'entrevistador'
        }));
        setInterviewers(formattedInterviewers);
        console.log('✅ Entrevistadores carregados:', formattedInterviewers.length);
      } else {
        console.error('❌ Falha ao carregar entrevistadores:', interviewersResult);
        setInterviewers([]);
      }

    } catch (error) {
      console.error('❌ Erro geral ao carregar analistas e entrevistadores:', error);
      setAnalysts([]);
      setInterviewers([]);
    }
  }
  async function loadStats() {
    try {
      console.log('📊 Carregando estatísticas...');
      const { googleSheetsService } = await import('../services/googleSheets');
      const result = await googleSheetsService.getReportStats();

      console.log('📈 Resultado estatísticas:', result);

      if (result.success && result.data) {
        setStats(result.data);
        console.log('✅ Estatísticas carregadas:', result.data);
      } else {
        console.error('❌ Falha ao carregar estatísticas:', result);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  }

  async function loadReport() {
    try {
      setLoading(true);
      console.log('📋 Carregando relatório...', {
        reportType,
        selectedAnalyst,
        selectedInterviewer
      });

      const { googleSheetsService } = await import('../services/googleSheets');

      let analystEmail = undefined;
      let interviewerEmail = undefined;

      if (selectedAnalyst !== 'todos') {
        const analyst = analysts.find(a => a.id === selectedAnalyst);
        analystEmail = analyst?.email;
        console.log('👤 Filtro analista:', analystEmail);
      }

      if (selectedInterviewer !== 'todos') {
        const interviewer = interviewers.find(i => i.id === selectedInterviewer);
        interviewerEmail = interviewer?.email;
        console.log('🎤 Filtro entrevistador:', interviewerEmail);
      }

      const result = await googleSheetsService.getReport(
        reportType,
        analystEmail,
        interviewerEmail
      );

      console.log('📦 Resultado relatório:', result);

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setReportData(data);
        console.log('✅ Relatório carregado:', data.length, 'registros');
      } else {
        console.error('❌ Falha ao carregar relatório:', result);
        setReportData([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }

  function getCandidateField(candidate: Candidate, ...fieldNames: string[]): string {
    for (const fieldName of fieldNames) {
      const value = (candidate as any)[fieldName];
      if (value !== undefined && value !== null && value !== '') {
        return String(value);
      }
    }
    return '';
  }

  function exportToCSV() {
    if (reportData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    let headers: string[] = [];
    let rows: string[][] = [];

    switch (reportType) {
      case 'classificados':
      case 'entrevista_classificados':
        headers = ['Nome Completo', 'Nome Social', 'CPF', 'Telefone', 'Cargo Pretendido', 'PCD', 'Analista', 'Entrevistador'];
        rows = reportData.map(c => [
          getCandidateField(c, 'NOMECOMPLETO', 'nome_completo', 'full_name'),
          getCandidateField(c, 'NOMESOCIAL', 'nome_social'),
          getCandidateField(c, 'CPF', 'cpf'),
          getCandidateField(c, 'TELEFONE', 'telefone'),
          getCandidateField(c, 'CARGOPRETENDIDO', 'cargo'),
          getCandidateField(c, 'VAGAPCD', 'vaga_pcd'),
          getCandidateField(c, 'assigned_analyst_name', 'Analista', 'analista_triagem'),
          getCandidateField(c, 'interviewer_name', 'entrevistador', 'Entrevistador')
        ]);
        break;

      case 'desclassificados':
        headers = ['Nome Completo', 'Nome Social', 'CPF', 'Telefone', 'Cargo Pretendido', 'Motivo Desclassificação', 'PCD', 'Analista'];
        rows = reportData.map(c => [
          getCandidateField(c, 'NOMECOMPLETO', 'nome_completo', 'full_name'),
          getCandidateField(c, 'NOMESOCIAL', 'nome_social'),
          getCandidateField(c, 'CPF', 'cpf'),
          getCandidateField(c, 'TELEFONE', 'telefone'),
          getCandidateField(c, 'CARGOPRETENDIDO', 'cargo'),
          getCandidateField(c, 'Motivo Desclassificação', 'motivo_desclassificacao'),
          getCandidateField(c, 'VAGAPCD', 'vaga_pcd'),
          getCandidateField(c, 'assigned_analyst_name', 'Analista', 'analista_triagem')
        ]);
        break;

      case 'entrevista_desclassificados':
        headers = ['Nome Completo', 'Nome Social', 'CPF', 'Telefone', 'Cargo Pretendido', 'Pontuação', 'PCD', 'Entrevistador'];
        rows = reportData.map(c => [
          getCandidateField(c, 'NOMECOMPLETO', 'nome_completo', 'full_name'),
          getCandidateField(c, 'NOMESOCIAL', 'nome_social'),
          getCandidateField(c, 'CPF', 'cpf'),
          getCandidateField(c, 'TELEFONE', 'telefone'),
          getCandidateField(c, 'CARGOPRETENDIDO', 'cargo'),
          c.interview_score?.toString() || c.pontuacao_entrevista?.toString() || '0',
          getCandidateField(c, 'VAGAPCD', 'vaga_pcd'),
          getCandidateField(c, 'interviewer_name', 'entrevistador', 'Entrevistador')
        ]);
        break;
    }

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportToExcel() {
    exportToCSV();
  }

  function exportToPDF() {
    if (reportData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const title = getReportTitle();

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header-info { margin-bottom: 20px; color: #666; }
            @media print {
              body { margin: 10px; }
              h1 { font-size: 18px; }
              th, td { padding: 4px; font-size: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="header-info">
            <p><strong>Data de emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de registros:</strong> ${reportData.length}</p>
            ${selectedAnalyst !== 'todos' ? `<p><strong>Analista:</strong> ${analysts.find(a => a.id === selectedAnalyst)?.name}</p>` : ''}
            ${selectedInterviewer !== 'todos' ? `<p><strong>Entrevistador:</strong> ${interviewers.find(i => i.id === selectedInterviewer)?.name}</p>` : ''}
          </div>
          ${generatePDFTable()}
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();
    }
  }

  function generatePDFTable(): string {
    const headers = getTableHeaders();
    const rows = reportData.map(candidate => getTableRowData(candidate));

    return `
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function getTableHeaders(): string[] {
    const baseHeaders = ['Nome Completo', 'Nome Social', 'CPF', 'Telefone', 'Cargo Pretendido'];

    switch (reportType) {
      case 'desclassificados':
        return [...baseHeaders, 'Motivo Desclassificação', 'PCD', 'Analista'];
      case 'entrevista_classificados':
        return [...baseHeaders, 'Pontuação', 'PCD', 'Entrevistador'];
      case 'entrevista_desclassificados':
        return [...baseHeaders, 'Pontuação', 'PCD', 'Entrevistador'];
      default:
        return [...baseHeaders, 'PCD', 'Analista'];
    }
  }

  function getTableRowData(candidate: Candidate): string[] {
    const baseData = [
      getCandidateField(candidate, 'NOMECOMPLETO', 'nome_completo', 'full_name') || 'Não informado',
      getCandidateField(candidate, 'NOMESOCIAL', 'nome_social') || '-',
      getCandidateField(candidate, 'CPF', 'cpf') || 'Não informado',
      getCandidateField(candidate, 'TELEFONE', 'telefone') || 'Não informado',
      getCandidateField(candidate, 'CARGOPRETENDIDO', 'cargo') || 'Não informado'
    ];

    switch (reportType) {
      case 'desclassificados':
        return [
          ...baseData,
          getCandidateField(candidate, 'Motivo Desclassificação', 'motivo_desclassificacao') || 'Não informado',
          getCandidateField(candidate, 'VAGAPCD', 'vaga_pcd') || 'Não',
          getCandidateField(candidate, 'assigned_analyst_name', 'Analista', 'analista_triagem') || '-'
        ];
      case 'entrevista_classificados':
      case 'entrevista_desclassificados':
        return [
          ...baseData,
          (candidate.interview_score?.toString() || candidate.pontuacao_entrevista?.toString() || '0'),
          getCandidateField(candidate, 'VAGAPCD', 'vaga_pcd') || 'Não',
          getCandidateField(candidate, 'interviewer_name', 'entrevistador', 'Entrevistador') || '-'
        ];
      default:
        return [
          ...baseData,
          getCandidateField(candidate, 'VAGAPCD', 'vaga_pcd') || 'Não',
          getCandidateField(candidate, 'assigned_analyst_name', 'Analista', 'analista_triagem') || '-'
        ];
    }
  }

  function getReportTitle(): string {
    switch (reportType) {
      case 'classificados':
        return 'Candidatos Classificados - Triagem';
      case 'desclassificados':
        return 'Candidatos Desclassificados - Triagem';
      case 'entrevista_classificados':
        return 'Candidatos Classificados - Entrevista';
      case 'entrevista_desclassificados':
        return 'Candidatos Desclassificados - Entrevista';
      default:
        return 'Relatório';
    }
  }

  function shouldShowAnalystFilter(): boolean {
    return reportType === 'classificados' || reportType === 'desclassificados';
  }

  function shouldShowInterviewerFilter(): boolean {
    return reportType === 'entrevista_classificados' || reportType === 'entrevista_desclassificados';
  }

  const filteredReportData = useMemo(() => {
    if (!searchTerm.trim()) {
      return reportData;
    }

    const searchLower = searchTerm.toLowerCase().trim();

    return reportData.filter(candidate => {
      const nomeCompleto = getCandidateField(candidate, 'NOMECOMPLETO', 'nome_completo', 'full_name').toLowerCase();
      const nomeSocial = getCandidateField(candidate, 'NOMESOCIAL', 'nome_social').toLowerCase();
      const cpf = getCandidateField(candidate, 'CPF', 'cpf').toLowerCase();

      return nomeCompleto.includes(searchLower) ||
             nomeSocial.includes(searchLower) ||
             cpf.includes(searchLower);
    });
  }, [reportData, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Relatórios</h2>
            <p className="text-sm text-gray-600 mt-1">Visualize e exporte relatórios do processo seletivo</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-800">Classificados</div>
                <div className="text-2xl font-bold text-blue-800">{stats.classificados}</div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-800">Desclassificados</div>
                <div className="text-2xl font-bold text-red-800">{stats.desclassificados}</div>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-800">Aprovados Entrevista</div>
                <div className="text-2xl font-bold text-green-800">{stats.entrevistaClassificados}</div>
              </div>
              <ClipboardCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-800">Reprovados Entrevista</div>
                <div className="text-2xl font-bold text-orange-800">{stats.entrevistaDesclassificados}</div>
              </div>
              <UserX className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <div className="flex-1 flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de Relatório</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="classificados">Classificados - Triagem</option>
                <option value="desclassificados">Desclassificados - Triagem</option>
                <option value="entrevista_classificados">Classificados - Entrevista</option>
                <option value="entrevista_desclassificados">Desclassificados - Entrevista</option>
              </select>
            </div>

            {shouldShowAnalystFilter() && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Analista {analysts.length > 0 && `(${analysts.length})`}
                </label>
                <select
                  value={selectedAnalyst}
                  onChange={(e) => setSelectedAnalyst(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos os Analistas</option>
                  {analysts.length === 0 ? (
                    <option disabled>Carregando...</option>
                  ) : (
                    analysts.map((analyst) => (
                      <option key={analyst.id} value={analyst.id}>
                        {analyst.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {shouldShowInterviewerFilter() && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Entrevistador {interviewers.length > 0 && `(${interviewers.length})`}
                </label>
                <select
                  value={selectedInterviewer}
                  onChange={(e) => setSelectedInterviewer(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos os Entrevistadores</option>
                  {interviewers.length === 0 ? (
                    <option disabled>Carregando...</option>
                  ) : (
                    interviewers.map((interviewer) => (
                      <option key={interviewer.id} value={interviewer.id}>
                        {interviewer.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-600 mb-1">Buscar Candidato</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={exportToPDF}
                disabled={reportData.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={exportToExcel}
                disabled={reportData.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={exportToCSV}
                disabled={reportData.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : reportData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum dado encontrado para este relatório</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{getReportTitle()}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredReportData.length} {filteredReportData.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                {searchTerm && ` (filtrados de ${reportData.length} total)`}
                {selectedAnalyst !== 'todos' && ` - Analista: ${analysts.find(a => a.id === selectedAnalyst)?.name}`}
                {selectedInterviewer !== 'todos' && ` - Entrevistador: ${interviewers.find(i => i.id === selectedInterviewer)?.name}`}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Nome Completo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Nome Social
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      CPF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Telefone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Cargo Pretendido
                    </th>
                    {reportType === 'desclassificados' && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Motivo Desclassificação
                      </th>
                    )}
                    {(reportType === 'entrevista_classificados' || reportType === 'entrevista_desclassificados') && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Pontuação
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      PCD
                    </th>
                    {shouldShowAnalystFilter() && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Analista
                      </th>
                    )}
                    {shouldShowInterviewerFilter() && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Entrevistador
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReportData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        Nenhum candidato encontrado com "{searchTerm}"
                      </td>
                    </tr>
                  ) : (
                    filteredReportData.map((candidate, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {getCandidateField(candidate, 'NOMECOMPLETO', 'nome_completo', 'full_name') || 'Não informado'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCandidateField(candidate, 'NOMESOCIAL', 'nome_social') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {getCandidateField(candidate, 'CPF', 'cpf') || 'Não informado'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCandidateField(candidate, 'TELEFONE', 'telefone') || 'Não informado'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCandidateField(candidate, 'CARGOPRETENDIDO', 'cargo') || 'Não informado'}
                      </td>
                      {reportType === 'desclassificados' && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getCandidateField(candidate, 'Motivo Desclassificação', 'motivo_desclassificacao') || 'Não informado'}
                        </td>
                      )}
                      {(reportType === 'entrevista_classificados' || reportType === 'entrevista_desclassificados') && (
                        <td className="px-4 py-3 text-sm font-semibold">
                          <span className={
                            Number(candidate.interview_score || candidate.pontuacao_entrevista || 0) >= 80
                              ? 'text-green-700'
                              : Number(candidate.interview_score || candidate.pontuacao_entrevista || 0) >= 60
                              ? 'text-yellow-700'
                              : 'text-red-700'
                          }>
                            {candidate.interview_score || candidate.pontuacao_entrevista || 0}/120
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm">
                        {getCandidateField(candidate, 'VAGAPCD', 'vaga_pcd') === 'Sim' ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Sim
                          </span>
                        ) : (
                          <span className="text-gray-400">Não</span>
                        )}
                      </td>
                      {shouldShowAnalystFilter() && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getCandidateField(candidate, 'assigned_analyst_name', 'Analista', 'analista_triagem') || '-'}
                        </td>
                      )}
                      {shouldShowInterviewerFilter() && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getCandidateField(candidate, 'interviewer_name', 'entrevistador', 'Entrevistador') || '-'}
                        </td>
                      )}
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
