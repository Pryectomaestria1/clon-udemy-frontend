const API_URL = import.meta.env.VITE_API_URL;

type TokenResolver = () => Promise<string>;

export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  upload<T>(path: string, formData: FormData): Promise<T>;
}

export function createApiClient(getToken?: TokenResolver): ApiClient {
  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    options?: { body?: unknown; isUpload?: boolean; requiresAuth?: boolean },
  ): Promise<T> => {
    const headers = new Headers();

    if (options?.requiresAuth !== false) {
      if (!getToken) {
        throw new Error('Missing auth token resolver for protected request');
      }

      const token = await getToken();
      headers.set('Authorization', `Bearer ${token}`);
    }

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (options?.body !== undefined) {
      if (options.isUpload) {
        requestInit.body = options.body as FormData;
      } else {
        headers.set('Content-Type', 'application/json');
        requestInit.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(`${API_URL}${path}`, requestInit);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }

    return (await response.json()) as T;
  };

  return {
    get<T>(path: string) {
      return request<T>('GET', path, { requiresAuth: Boolean(getToken) });
    },
    post<T>(path: string, body?: unknown) {
      return request<T>('POST', path, { body, requiresAuth: true });
    },
    put<T>(path: string, body?: unknown) {
      return request<T>('PUT', path, { body, requiresAuth: true });
    },
    upload<T>(path: string, formData: FormData) {
      return request<T>('POST', path, {
        body: formData,
        isUpload: true,
        requiresAuth: true,
      });
    },
  };
}
