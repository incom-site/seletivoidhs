export interface Candidate {
  id: string;
  registration_number?: string;
  NOMECOMPLETO?: string;
  full_name?: string;
  nome_completo?: string;
  NOMESOCIAL?: string;
  nome_social?: string;
  CPF?: string;
  cpf?: string;
  cpf_numero?: string;
  TELEFONE?: string;
  telefone?: string;
  email?: string;
  AREAATUACAO?: string;
  area?: string;
  Area?: string;
  desired_area?: string;
  area_atuacao_pretendida?: string;
  CARGOPRETENDIDO?: string;
  cargo?: string;
  Cargo?: string;
  cargo_administrativo?: string | boolean;
  cargo_assistencial?: string | boolean;
  VAGAPCD?: string;
  vaga_pcd?: string;
  'LAUDO MEDICO'?: string;
  CURRICULOVITAE?: string;
  DOCUMENTOSPESSOAIS?: string;
  DOCUMENTOSPROFISSIONAIS?: string;
  DIPLOMACERTIFICADO?: string;
  DOCUMENTOSCONSELHO?: string;
  ESPECIALIZACOESCURSOS?: string;
  status?: string;
  Status?: string;
  statusTriagem?: string;
  status_triagem?: string;
  assigned_to?: string;
  Analista?: string;
  analista_triagem?: string;
  assigned_analyst_name?: string;
  assigned_at?: string;
  assigned_by?: string;
  priority?: number;
  notes?: string;
  screening_notes?: string;
  observacoes_triagem?: string;
  'Motivo Desclassificação'?: string;
  motivo_desclassificacao?: string;
  disqualification_reason?: {
    reason: string;
  };
  created_at?: string;
  updated_at?: string;
  screened_at?: string;
  data_hora_triagem?: string;

  // Campos de entrevista
  entrevistador?: string;
  Entrevistador?: string;
  interviewer?: string;
  interviewer_name?: string;
  status_entrevista?: string;
  interview_status?: string;
  interview_result?: string;
  interview_score?: number;
  pontuacao_entrevista?: number;

  // Campos de mensagens
  EMAIL_SENT?: string | boolean;
  email_sent?: boolean;
  SMS_SENT?: string | boolean;
  sms_sent?: boolean;
}
