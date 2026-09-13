const BASE_URL = 'http://localhost:3000';

class ApiError extends Error {
  constructor({ message, code, traceId, statusCode, details }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.traceId = traceId;
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const { method = 'GET', body, params } = options;

  const url = new URL(path, BASE_URL);

  if (params && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  const fetchOptions = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorPayload = data && typeof data === 'object' ? data : {};
    throw new ApiError({
      message: errorPayload.message || response.statusText || 'Request failed',
      code: errorPayload.code || 'UNKNOWN_ERROR',
      traceId: errorPayload.traceId || undefined,
      statusCode: response.status,
      details: errorPayload.details || undefined,
    });
  }

  return data;
}

const apiClient = {
  get(path, params) {
    return request(path, { method: 'GET', params });
  },
  post(path, body) {
    return request(path, { method: 'POST', body });
  },
  patch(path, body) {
    return request(path, { method: 'PATCH', body });
  },
  delete(path) {
    return request(path, { method: 'DELETE' });
  },
};

export default apiClient;
export { ApiError, BASE_URL };
