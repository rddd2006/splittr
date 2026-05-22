import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

client.interceptors.request.use(cfg => {
  const t = localStorage.getItem('accessToken');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

client.interceptors.response.use(r => r, async err => {
  const orig = err.config;
  if (err.response?.status === 401 && !orig._retry) {
    orig._retry = true;
    try {
      const rt = localStorage.getItem('refreshToken');
      if (!rt) throw new Error('no refresh token');
      const res = await axios.post(`${BASE}/auth/refresh`, { refreshToken: rt });
      localStorage.setItem('accessToken',  res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      orig.headers.Authorization = `Bearer ${res.data.accessToken}`;
      return client(orig);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  }
  return Promise.reject(err);
});

export const authApi = {
  register: d => client.post('/auth/register', d),
  login:    d => client.post('/auth/login', d),
  logout:   rt => client.post('/auth/logout', { refreshToken: rt }),
  me:       () => client.get('/auth/me'),
};

export const web3Api = {
  getNonce:  address  => client.get(`/web3/nonce?address=${address}`),
  verify:    data     => client.post('/web3/verify', data),
  linkWallet: data    => client.post('/web3/link', data),
  unlinkWallet: ()   => client.delete('/web3/link'),
};

export const groupsApi = {
  list:             () => client.get('/groups'),
  create:           d  => client.post('/groups', d),
  get:              id => client.get(`/groups/${id}`),
  update:           (id, d) => client.put(`/groups/${id}`, d),
  delete:           id => client.delete(`/groups/${id}`),
  join:             code => client.post('/groups/join', { joinCode: code }),
  regenerateCode:   id => client.post(`/groups/${id}/regenerate-code`),
  getBalances:      id => client.get(`/groups/${id}/balances`),
  getSettlementPlan:id => client.get(`/groups/${id}/settlement-plan`),
  addMember:        (id, email) => client.post(`/groups/${id}/members`, { email }),
  removeMember:     (id, mId)  => client.delete(`/groups/${id}/members/${mId}`),
};

export const expensesApi = {
  list:   (gid, p) => client.get(`/groups/${gid}/expenses`, { params: p }),
  create: (gid, d) => client.post(`/groups/${gid}/expenses`, d),
  get:    id       => client.get(`/expenses/${id}`),
  update: (id, d)  => client.put(`/expenses/${id}`, d),
  delete: id       => client.delete(`/expenses/${id}`),
};

export const settlementsApi = {
  create: d    => client.post('/settlements', d),
  list:   gid  => client.get(`/settlements/group/${gid}`),
};

export default client;
