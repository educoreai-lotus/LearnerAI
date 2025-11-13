/**
 * HttpClient
 * Simple HTTP client wrapper (using fetch)
 */
export class HttpClient {
  async get(url, options = {}) {
    return this._request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this._request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  async put(url, data, options = {}) {
    return this._request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  async delete(url, options = {}) {
    return this._request(url, { ...options, method: 'DELETE' });
  }

  async _request(url, options = {}) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || data}`);
      }

      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      if (error.message.startsWith('HTTP')) {
        throw error;
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

