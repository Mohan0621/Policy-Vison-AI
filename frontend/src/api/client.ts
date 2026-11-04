export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    retryable: boolean;
  } | null;
  request_id: string;
}

export interface SourceCitation {
  document_name: string;
  page_number: number;
  section_heading: string;
  passage_text: string;
  relevance_score: number;
}

export interface SimplifiedExplanation {
  what_is_covered: string;
  what_is_not_covered: string;
  how_to_claim: string;
  language: string;
  fk_grade_level: number;
  source_citations?: SourceCitation[];
  fallback_language?: string | null;
}

export interface QAMessage {
  role: 'user' | 'assistant';
  content: string;
  citations: SourceCitation[];
  timestamp: string;
}

export type VisualStyle = 'professional_infographic' | 'illustrated_cartoon' | 'flowchart_diagram';

export type IndianLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
}

export interface AuthResult {
  token: string;
  user: UserProfile;
}

class APIClient {
  private baseUrl = '/api/v1';
  public onSessionExpired?: () => void;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('pv_token') || sessionStorage.getItem('pv_token'))
      : null;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401) {
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    }

    const data = await res.json();
    return data as APIResponse<T>;
  }

  // Auth Endpoints
  public auth = {
    login: async (email: string, password: string, remember_me: boolean = false) => {
      return this.request<AuthResult>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me }),
      });
    },

    register: async (name: string, email: string, password: string, organization: string = 'Personal', role: string = 'Policyholder') => {
      return this.request<AuthResult>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, organization, role }),
      });
    },

    me: async () => {
      return this.request<UserProfile>('/auth/me');
    },

    logout: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pv_token');
        localStorage.removeItem('pv_user');
        sessionStorage.removeItem('pv_token');
        sessionStorage.removeItem('pv_user');
      }
      return this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    },
  };

  // Document Endpoints
  public documents = {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.request<{
        session_id: string;
        document_name: string;
        page_count: number;
        index_status: string;
      }>('/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },

    submitText: async (text: string) => {
      return this.request<{
        session_id: string;
        character_count: number;
        index_status: string;
      }>('/documents/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    },

    getStatus: async () => {
      return this.request<{
        filename: string;
        page_count: number;
        index_status: string;
      }>('/documents/status');
    },
  };

  // Generation Endpoints
  public generate = {
    explanation: async (language: string = 'en', style: VisualStyle = 'professional_infographic') => {
      return this.request<{
        explanation: SimplifiedExplanation;
        citations: SourceCitation[];
        verifications: Array<{ statement: string; supported: boolean; score: number }>;
      }>('/generate/explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, style }),
      });
    },

    coverageVisual: async (style: VisualStyle = 'professional_infographic', language: string = 'en') => {
      return this.request<{ task_id: string; status: string }>('/generate/coverage-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, language }),
      });
    },

    claimsVisual: async (style: VisualStyle = 'flowchart_diagram', language: string = 'en') => {
      return this.request<{ task_id: string; status: string }>('/generate/claims-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, language }),
      });
    },

    getTaskStatus: async (taskId: string) => {
      return this.request<{
        status: 'pending' | 'running' | 'complete' | 'failed';
        result?: {
          image_id: string;
          image_url: string;
          width: number;
          height: number;
          citations: SourceCitation[];
        };
        error?: string;
      }>(`/generate/status/${taskId}`);
    },
  };

  // Q&A Endpoints
  public qa = {
    ask: async (question: string, style: VisualStyle = 'professional_infographic', language: string = 'en') => {
      return this.request<{
        answer: string;
        citations: SourceCitation[];
        visual_task_id: string | null;
        no_content_message: boolean;
      }>('/qa/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, style, language }),
      });
    },

    getHistory: async () => {
      return this.request<{ history: QAMessage[] }>('/qa/history');
    },

    clearHistory: async () => {
      return this.request<{ cleared: boolean }>('/qa/history', {
        method: 'DELETE',
      });
    },
  };

  // Export Endpoints
  public export = {
    getImageUrl: (imageId: string) => `${this.baseUrl}/export/image/${imageId}`,

    downloadZip: async () => {
      const res = await fetch(`${this.baseUrl}/export/session-zip`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to download ZIP archive');
      }
      return await res.blob();
    },
  };

  // Session Endpoints
  public session = {
    get: async () => {
      return this.request<any>('/session');
    },

    delete: async () => {
      return this.request<{ deleted: boolean }>('/session', {
        method: 'DELETE',
      });
    },
  };
}

export const apiClient = new APIClient();

