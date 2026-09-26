import { authApi } from '../../../services/apiClient.js';
// Compatibility adapter for preserved feature services; HTTP remains canonical.
export async function apiRequest(path, options = {}) {
 const response = await authApi.request({url: path.replace(/^\/api\/iam/, ''), method: options.method || 'GET', data: options.body ? JSON.parse(options.body) : undefined, headers: options.headers});
 return {success:true, data:response.data};
}
