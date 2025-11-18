import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { candidateService } from '../services/candidateService';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
}

export default function CsvImportTool() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [progress, setProgress] = useState<ImportProgress>({ current: 0, total: 0, percentage: 0 });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      previewFile(selectedFile);
    }
  }

  async function previewFile(file: File) {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1, 6).map(line => {
      const values = parseCSVLine(line);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    setPreview(rows);
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function generateRegistrationNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CAND-${timestamp}-${random}`;
  }

  async function handleImport() {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      const total = lines.length - 1;

      setProgress({ current: 0, total, percentage: 0 });

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim().replace(/^"|"$/g, '') || '';
          });

          // Mapeamento direto para as colunas da sua planilha
          const candidateData = {
            registration_number: row['NÚMERO DE INSCRIÇÃO'] || generateRegistrationNumber(),
            NOMECOMPLETO: row['NOMECOMPLETO'] || row['Nome Completo'] || '',
            NOMESOCIAL: row['NOMESOCIAL'] || row['Nome Social'] || '',
            CPF: row['CPF'] || row['cpf'] || '',
            VAGAPCD: row['VAGAPCD'] || row['Vaga PCD'] || 'Não',
            'LAUDO MEDICO': row['LAUDO MEDICO'] || row['Laudo Médico'] || '',
            AREAATUACAO: row['AREAATUACAO'] || row['Área de Atuação'] || '',
            CARGOPRETENDIDO: row['CARGOPRETENDIDO'] || row['Cargo Pretendido'] || '',
            CURRICULOVITAE: row['CURRICULOVITAE'] || row['Currículo Vitae'] || '',
            DOCUMENTOSPESSOAIS: row['DOCUMENTOSPESSOAIS'] || row['Documentos Pessoais'] || '',
            DOCUMENTOSPROFISSIONAIS: row['DOCUMENTOSPROFISSIONAIS'] || row['Documentos Profissionais'] || '',
            DIPLOMACERTIFICADO: row['DIPLOMACERTIFICADO'] || row['Diploma/Certificado'] || '',
            DOCUMENTOSCONSELHO: row['DOCUMENTOSCONSELHO'] || row['Documentos do Conselho'] || '',
            ESPECIALIZACOESCURSOS: row['ESPECIALIZACOESCURSOS'] || row['Especializações/Cursos'] || '',
            status: 'pendente' as const,
            priority: 0,
            notes: 'Importado via CSV'
          };

          // Validação básica
          if (!candidateData.NOMECOMPLETO.trim()) {
            throw new Error('Nome completo é obrigatório');
          }

          if (!candidateData.CPF.trim()) {
            throw new Error('CPF é obrigatório');
          }

          // Verificar se CPF já existe
          const existingCandidate = await candidateService.getCandidateByCPF(candidateData.CPF);
          if (existingCandidate) {
            throw new Error(`CPF ${candidateData.CPF} já cadastrado`);
          }

          await candidateService.createCandidate(candidateData);
          success++;
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`Linha ${i + 1}: ${errorMessage}`);
        }

        const current = i;
        const percentage = Math.round((current / total) * 100);
        setProgress({ current, total, percentage });
      }

      setResult({ success, failed, errors });
    } catch (error) {
      console.error('Erro ao importar:', error);
      setResult({
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Erro ao processar arquivo'],
      });
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setPreview([]);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7" />
            Importar Candidatos do Google Sheets
          </h2>
          <p className="text-blue-100 mt-2">
            Exporte sua planilha como CSV e faça upload aqui
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Como usar:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Abra sua planilha do Google Sheets</li>
              <li>Vá em Arquivo → Fazer download → Valores separados por vírgula (.csv)</li>
              <li>Faça upload do arquivo CSV abaixo</li>
              <li>Revise a prévia e clique em "Importar"</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Colunas esperadas:</h3>
            <div className="text-sm text-blue-800 grid grid-cols-2 gap-1">
              <div>• NOMECOMPLETO</div>
              <div>• NOMESOCIAL</div>
              <div>• CPF</div>
              <div>• VAGAPCD</div>
              <div>• LAUDO MEDICO</div>
              <div>• AREAATUACAO</div>
              <div>• CARGOPRETENDIDO</div>
              <div>• CURRICULOVITAE</div>
              <div>• DOCUMENTOSPESSOAIS</div>
              <div>• DOCUMENTOSPROFISSIONAIS</div>
              <div>• DIPLOMACERTIFICADO</div>
              <div>• DOCUMENTOSCONSELHO</div>
              <div>• ESPECIALIZACOESCURSOS</div>
            </div>
          </div>

          {!file && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
              <label className="cursor-pointer">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-700 mb-2">
                  Clique para selecionar ou arraste o arquivo CSV
                </p>
                <p className="text-sm text-gray-500">
                  Apenas arquivos .csv são aceitos
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {file && !result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {preview.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Prévia (primeiras 5 linhas):
                  </h3>
                  <div className="overflow-auto border rounded-lg max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(preview[0]).map(key => (
                            <th
                              key={key}
                              className="px-3 py-2 text-left font-medium text-gray-700 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value: any, cellIdx) => (
                              <td
                                key={cellIdx}
                                className="px-3 py-2 text-gray-900 truncate max-w-xs"
                                title={value}
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Progresso da importação</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    {progress.current} de {progress.total} registros processados
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Importar Candidatos
                    </>
                  )}
                </button>
                <button
                  onClick={reset}
                  disabled={importing}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${
                result.failed === 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className={`flex items-center gap-2 mb-2 ${
                  result.failed === 0 ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {result.failed === 0 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <h3 className="font-semibold">
                    {result.failed === 0 ? 'Importação Concluída' : 'Importação Parcial'}
                  </h3>
                </div>
                <div className={`text-sm space-y-1 ${
                  result.failed === 0 ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  <p>✓ {result.success} candidatos importados com sucesso</p>
                  {result.failed > 0 && (
                    <p>✗ {result.failed} candidatos falharam</p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-semibold">Erros Encontrados</h3>
                  </div>
                  <div className="text-sm text-red-700 space-y-1 max-h-48 overflow-auto">
                    {result.errors.slice(0, 10).map((error, idx) => (
                      <p key={idx}>• {error}</p>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="font-semibold">
                        ... e mais {result.errors.length - 10} erros
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Importar Outro Arquivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
