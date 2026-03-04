/**
 * LEGALLENS LOCAL SECURE VAULT SERVICE
 * Pure LocalStorage implementation for a completely serverless experience.
 */

const STORAGE_KEYS: Record<string, string> = {
  'legal/chat': 'chat_history',
  'legal/my-documents': 'legal_documents',
  'legal/log-document': 'legal_documents',
  'legal/my-drafts': 'legal_drafts',
  'legal/log-draft': 'legal_drafts',
  'legal/advocate/client-documents': 'legal_documents',
  'legal/advocate/client-document': 'legal_documents'
};

const getLocalData = (key: string) => {
  try {
    const data = localStorage.getItem(`legallens_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocalData = (key: string, data: any) => {
  localStorage.setItem(`legallens_${key}`, JSON.stringify(data));
  // Dispatch a custom event for reactivity across components
  window.dispatchEvent(new CustomEvent('legallens_vault_update', { detail: { key } }));
};

export async function apiRequest(endpoint: string, options: any = {}): Promise<any> {
  const fullPath = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const path = fullPath.split('?')[0];
  const storageKey = STORAGE_KEYS[path];

  if (!storageKey) return [];

  // Simulate minimal processing delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Handle GET requests
  if (options.method === 'GET' || !options.method) {
    let data = getLocalData(storageKey);
    
    // Filtering logic for specific routes
    if (path.includes('client-documents')) {
      const urlParams = new URLSearchParams(fullPath.split('?')[1]);
      const clientName = urlParams.get('client_name');
      if (clientName) {
        data = data.filter((d: any) => d.client_name === clientName);
      }
    }
    return data;
  }

  // Handle POST requests
  if (options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const currentData = getLocalData(storageKey);
    const newItem = {
      ...body,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      upload_date: new Date().toISOString(),
      uploadDate: new Date().toISOString()
    };
    
    setLocalData(storageKey, [newItem, ...currentData]);
    return newItem;
  }

  return { status: 'success' };
}

/**
 * Reactive Listener for Local Vault changes.
 * Allows components to auto-refresh when the underlying localStorage key changes.
 */
export function subscribeToTable(endpoint: string, onUpdate: () => void) {
  const fullPath = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const storageKey = STORAGE_KEYS[fullPath];
  
  const handler = (event: any) => {
    if (event.detail.key === storageKey) {
      onUpdate();
    }
  };

  window.addEventListener('legallens_vault_update', handler);
  
  return {
    unsubscribe: () => window.removeEventListener('legallens_vault_update', handler)
  };
}