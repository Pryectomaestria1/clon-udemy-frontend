import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../client';

describe('createApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches bearer token for authenticated GET', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const getToken = vi.fn().mockResolvedValue('token-123');
    const api = createApiClient(getToken);

    await api.get('/courses');

    expect(getToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/courses`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const authHeader = new Headers(requestInit.headers).get('Authorization');
    expect(authHeader).toBe('Bearer token-123');
  });

  it('omits bearer token for public GET', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: '1' }]), { status: 200 }),
    );
    const publicApi = createApiClient();

    await publicApi.get('/courses');

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const authHeader = new Headers(requestInit.headers).get('Authorization');
    expect(authHeader).toBeNull();
  });

  it('throws with HTTP status and body on non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Forbidden', { status: 403 }),
    );
    const api = createApiClient(vi.fn().mockResolvedValue('token'));

    await expect(api.get('/private')).rejects.toThrow('HTTP 403: Forbidden');
  });

  it('upload omits Content-Type for FormData', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const api = createApiClient(vi.fn().mockResolvedValue('token'));
    const formData = new FormData();
    formData.append('file', new Blob(['demo']), 'demo.txt');

    await api.upload('/files', formData);

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const contentType = new Headers(requestInit.headers).get('Content-Type');
    expect(contentType).toBeNull();
  });

  it('fails before fetch when token resolver is missing for protected request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const publicApi = createApiClient();

    await expect(publicApi.post('/courses', { title: 'x' })).rejects.toThrow(
      'Missing auth token resolver for protected request',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('post sends JSON with application/json', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'course-1' }), { status: 200 }),
    );
    const api = createApiClient(vi.fn().mockResolvedValue('token'));

    await api.post('/courses', { title: 'TypeScript' });

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(requestInit.body).toBe(JSON.stringify({ title: 'TypeScript' }));
    const contentType = new Headers(requestInit.headers).get('Content-Type');
    expect(contentType).toBe('application/json');
  });
});
