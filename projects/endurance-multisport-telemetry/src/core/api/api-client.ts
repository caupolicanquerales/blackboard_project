export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type Unsubscribe = () => void;

export interface ApiTransportAdapter {
  request<T>(method: HttpMethod, url: string, body?: unknown): Promise<T>;
  subscribe<T>(channel: string, handler: (message: T) => void): Unsubscribe;
}

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

// core/config does not exist yet; read the Expo public env with a local fallback.
const BASE_URL: string = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const resolveUrl = (url: string): string =>
  /^https?:\/\//i.test(url) ? url : `${BASE_URL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;

const fetchAdapter: ApiTransportAdapter = {
  async request<T>(method: HttpMethod, url: string, body?: unknown): Promise<T> {
    const target = resolveUrl(url);
    const response = await fetch(target, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status} ${response.statusText}`, response.status, target);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  },
  subscribe(): Unsubscribe {
    // Live streams need a transport (e.g. the mock layer) installed via setAdapter.
    return () => undefined;
  },
};

class ApiClient {
  private adapter: ApiTransportAdapter = fetchAdapter;

  setAdapter(adapter: ApiTransportAdapter): void {
    this.adapter = adapter;
  }

  async request<T>(method: HttpMethod, url: string, body?: unknown): Promise<T> {
    try {
      return await this.adapter.request<T>(method, url, body);
    } catch (error: unknown) {
      this.logError(`${method} ${url}`, error);
      throw error;
    }
  }

  subscribe<T>(channel: string, handler: (message: T) => void): Unsubscribe {
    try {
      return this.adapter.subscribe<T>(channel, (message: T) => {
        try {
          handler(message);
        } catch (error: unknown) {
          this.logError(`handler ${channel}`, error);
        }
      });
    } catch (error: unknown) {
      this.logError(`subscribe ${channel}`, error);
      throw error;
    }
  }

  private logError(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[apiClient] ${context} failed: ${message}`);
  }
}

export const apiClient = new ApiClient();
