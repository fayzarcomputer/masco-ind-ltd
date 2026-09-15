// ==============================================================================
// GLOBAL CONFIGURATION & API HELPERS
// ==============================================================================
const API_BASE = window.location.origin;

const API = {
  // Client Endpoints
  getClients: () => fetch(`${API_BASE}/api/clients`).then(r => r.json()),
  createClient: (data) => fetch(`${API_BASE}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // Invoice Endpoints
  getInvoices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/api/invoices${qs ? '?' + qs : ''}`).then(r => r.json());
  },
  getInvoiceById: (id) => fetch(`${API_BASE}/api/invoices/${encodeURIComponent(id)}`).then(r => r.json()),
  createInvoice: (data) => fetch(`${API_BASE}/api/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteInvoice: (id) => fetch(`${API_BASE}/api/invoices/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).then(r => r.json()),

  // Analytics Endpoints
  getAnalytics: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/api/analytics${qs ? '?' + qs : ''}`).then(r => r.json());
  }
};

window.API = API;
