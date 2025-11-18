const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwbr9Vm-EJxPTxGEP12UtwWfeKTGU1LsCjnHxQzkY8a9AOOozLNeDKGcflIknT5_FOq/exec';
interface GoogleSheetsResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

async function makeRequest(action: string, params: any = {}): Promise<GoogleSheetsResponse> {
  try {
    // Construir URL com query parameters para evitar preflight CORS
    const queryParams = new URLSearchParams({ action, ...params });
    const url = `${SCRIPT_URL}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro na requisição ${action}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro na requisição'
    };
  }
}

export const googleSheetsService = {
  async getCandidates(filters?: any): Promise<GoogleSheetsResponse> {
    return makeRequest('getCandidates', filters);
  },

  async updateCandidateStatus(
    registrationNumber: string,
    statusTriagem: 'Classificado' | 'Desclassificado' | 'Revisar',
    options?: {
      reasonId?: string;
      notes?: string;
      analystEmail?: string;
    }
  ): Promise<GoogleSheetsResponse> {
    return makeRequest('updateCandidateStatus', {
      registrationNumber,
      statusTriagem,
      ...options
    });
  },

  async getCandidatesByStatus(status: 'Classificado' | 'Desclassificado' | 'Revisar'): Promise<GoogleSheetsResponse> {
    console.log('📊 getCandidatesByStatus - Status:', status);
    const result = await makeRequest('getCandidatesByStatus', { status });
    console.log('📦 Dados recebidos:', result);
    return result;
  },

  async logMessage(
    registrationNumber: string,
    messageType: 'email' | 'sms',
    recipient: string,
    subject: string | null,
    content: string,
    sentBy: string
  ): Promise<GoogleSheetsResponse> {
    return makeRequest('logMessage', {
      registrationNumber,
      messageType,
      recipient,
      subject,
      content,
      sentBy
    });
  },

  async getDisqualificationReasons(): Promise<GoogleSheetsResponse> {
    return makeRequest('getDisqualificationReasons');
  },

  async getMessageTemplates(messageType?: 'email' | 'sms'): Promise<GoogleSheetsResponse> {
    return makeRequest('getMessageTemplates', { messageType });
  },

  async sendMessages(
    messageType: 'email' | 'sms',
    subject: string,
    content: string,
    candidateIds: string,
    sentBy: string,
    fromAlias?: string
  ): Promise<GoogleSheetsResponse> {
    console.log('📤 Enviando requisição para Google Apps Script');
    console.log('  Tipo:', messageType);
    console.log('  IDs:', candidateIds);
    console.log('  Alias:', fromAlias);

    const result = await makeRequest('sendMessages', {
      messageType,
      subject: subject || '',
      content,
      candidateIds,
      sentBy,
      fromAlias
    });

    console.log('📦 Resposta recebida:', result);
    return result;
  },

  async updateMessageStatus(
    registrationNumbers: string[],
    messageType: 'email' | 'sms',
    status: string
  ): Promise<GoogleSheetsResponse> {
    return makeRequest('updateMessageStatus', {
      registrationNumbers: registrationNumbers.join(','),
      messageType,
      status
    });
  },

  async moveToInterview(candidateIds: string): Promise<GoogleSheetsResponse> {
    return makeRequest('moveToInterview', { candidateIds });
  },

  async getInterviewCandidates(): Promise<GoogleSheetsResponse> {
    return makeRequest('getInterviewCandidates');
  },

  async getInterviewers(): Promise<GoogleSheetsResponse> {
    return makeRequest('getInterviewers');
  },

  async allocateToInterviewer(
    candidateIds: string,
    interviewerEmail: string,
    adminEmail: string
  ): Promise<GoogleSheetsResponse> {
    return makeRequest('allocateToInterviewer', {
      candidateIds,
      interviewerEmail,
      adminEmail
    });
  },

  async getInterviewerCandidates(interviewerEmail: string): Promise<GoogleSheetsResponse> {
    return makeRequest('getInterviewerCandidates', { interviewerEmail });
  },

  async saveInterviewEvaluation(evaluation: any): Promise<GoogleSheetsResponse> {
    return makeRequest('saveInterviewEvaluation', evaluation);
  },

  async getReportStats(): Promise<GoogleSheetsResponse> {
    return makeRequest('getReportStats');
  },

  async getReport(
    reportType: string,
    analystEmail?: string,
    interviewerEmail?: string
  ): Promise<GoogleSheetsResponse> {
    const params: any = { reportType };
    if (analystEmail) params.analystEmail = analystEmail;
    if (interviewerEmail) params.interviewerEmail = interviewerEmail;
    return makeRequest('getReport', params);
  },

  async getEmailAliases(): Promise<GoogleSheetsResponse> {
    return makeRequest('getEmailAliases');
  },

  async saveScreening(screeningData: any): Promise<GoogleSheetsResponse> {
    return makeRequest('saveScreening', screeningData);
  },

  async fetchCandidates(): Promise<any[]> {
    const result = await makeRequest('getCandidates');
    if (result.success && result.data) {
      return result.data.candidates || result.data || [];
    }
    return [];
  },

  async getAnalysts(): Promise<GoogleSheetsResponse> {
    return makeRequest('getAnalysts');
  }
};
