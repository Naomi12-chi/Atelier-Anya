// Atelier Anya - Centralized Authentication Utility

const AUTH_CONFIG = {
  LOGIN_PAGE: 'login.html',
  STORAGE_KEYS: {
    TOKEN: 'token',
    USER_ID: 'Id',
    ROLE: 'role'
  },
  PENDING_ACTION_KEY: 'pendingAuthAction'
};

function getToken() {
  return localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
}

function getUserId() {
  return localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER_ID);
}

function getRole() {
  return localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.ROLE);
}

function hasToken() {
  const token = getToken();
  return !!token;
}

function saveAuthData(data) {
  if (data.token) {
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN, data.token);
  }
  if (data.Id || data.userId) {
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.USER_ID, data.Id || data.userId);
  }
  if (data.role) {
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.ROLE, data.role);
  }
}

function clearAuthData() {
  localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_ID);
  localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ROLE);
}

function savePendingAction(action) {
  try {
    const safeAction = {
      type: action.type,
      payload: action.payload ? JSON.parse(JSON.stringify(action.payload)) : null,
      returnUrl: action.returnUrl || window.location.href,
      method: action.method || 'GET',
      timestamp: Date.now()
    };
    sessionStorage.setItem(AUTH_CONFIG.PENDING_ACTION_KEY, JSON.stringify(safeAction));
  } catch (error) {
    console.error('Failed to save pending action:', error);
  }
}

function getPendingAction() {
  try {
    const data = sessionStorage.getItem(AUTH_CONFIG.PENDING_ACTION_KEY);
    if (!data) return null;
    const action = JSON.parse(data);
    if (action.timestamp && Date.now() - action.timestamp > 10 * 60 * 1000) {
      clearPendingAction();
      return null;
    }
    return action;
  } catch (error) {
    console.error('Failed to get pending action:', error);
    clearPendingAction();
    return null;
  }
}

function clearPendingAction() {
  sessionStorage.removeItem(AUTH_CONFIG.PENDING_ACTION_KEY);
}

function isValidReturnUrl(url) {
  try {
    const urlObj = new URL(url, window.location.origin);
    if (urlObj.origin !== window.location.origin) {
      return false;
    }
    if (urlObj.pathname.includes('login') || urlObj.pathname.includes('signup')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getSafeReturnUrl(returnUrl) {
  if (returnUrl && isValidReturnUrl(returnUrl)) {
    return returnUrl;
  }
  const referrer = document.referrer;
  if (referrer && isValidReturnUrl(referrer)) {
    return referrer;
  }
  return window.location.href;
}

function redirectToLogin(returnUrl) {
  const pendingAction = getPendingAction();
  const urlToSave = returnUrl || (pendingAction ? pendingAction.returnUrl : window.location.href);
  const safeUrl = getSafeReturnUrl(urlToSave);
  sessionStorage.setItem('authReturnUrl', safeUrl);
  if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
    return;
  }
  window.location.href = AUTH_CONFIG.LOGIN_PAGE;
}

async function authenticatedFetch(url, options = {}) {
  const token = getToken();
  if (!token) {
    if (options.method && options.method !== 'GET') {
      try {
        let payload = null;
        if (options.body) {
          if (typeof options.body === 'string') {
            payload = JSON.parse(options.body);
          } else {
            payload = options.body;
          }
        }
        savePendingAction({
          type: 'API_CALL',
          payload: {
            url: url,
            method: options.method,
            body: payload,
            headers: options.headers
          },
          returnUrl: window.location.href
        });
      } catch (error) {
        console.error('Failed to save pending API action:', error);
      }
    }
    redirectToLogin(window.location.href);
    throw new Error('Authentication required');
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  
  const fetchOptions = {
    ...options,
    headers: headers
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (response.status === 401) {
      clearAuthData();
      if (options.method && options.method !== 'GET') {
        try {
          let payload = null;
          if (options.body) {
            if (typeof options.body === 'string') {
              payload = JSON.parse(options.body);
            } else {
              payload = options.body;
            }
          }
          savePendingAction({
            type: 'API_CALL',
            payload: {
              url: url,
              method: options.method,
              body: payload,
              headers: options.headers
            },
            returnUrl: window.location.href
          });
        } catch (e) {}
      }
      redirectToLogin(window.location.href);
      throw new Error('Session expired');
    } else if (response.status === 403) {
      try {
        const errorData = await response.clone().json();
        if (typeof errorData === 'string' && 
            (errorData.toLowerCase().includes('auth') || 
             errorData.toLowerCase().includes('token') ||
             errorData.toLowerCase().includes('login'))) {
          clearAuthData();
          redirectToLogin(window.location.href);
          throw new Error('Session expired');
        }
      } catch (e) {
        // If 403 and can't determine, return response (permission issue)
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
}

async function resumePendingAction() {
  const pendingAction = getPendingAction();
  if (!pendingAction) {
    return false;
  }
  try {
    if (pendingAction.type === 'API_CALL' && pendingAction.payload) {
      const { url, method, body, headers } = pendingAction.payload;
      const token = getToken();
      if (!token) {
        clearPendingAction();
        return false;
      }
      const fetchOptions = {
        method: method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(headers || {})
        }
      };
      if (body && method !== 'GET') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const response = await fetch(url, fetchOptions);
      if (response.ok) {
        clearPendingAction();
        return { success: true, action: pendingAction, response: response };
      } else if (response.status === 401) {
        clearPendingAction();
        redirectToLogin(pendingAction.returnUrl);
        return false;
      } else {
        clearPendingAction();
        return { success: false, action: pendingAction, response: response };
      }
    }
    clearPendingAction();
    return { success: true, action: pendingAction };
  } catch (error) {
    console.error('Failed to resume pending action:', error);
    clearPendingAction();
    return false;
  }
}

async function requireAuth(options = {}) {
  const {
    requireAdmin = false,
    redirectTo = null,
    checkBackend = true
  } = options;
  
  const token = getToken();
  const userId = getUserId();
  const role = getRole();
  
  if (!token || !userId) {
    savePendingAction({
      type: 'PAGE_VISIT',
      returnUrl: window.location.href
    });
    redirectToLogin(redirectTo || window.location.href);
    return false;
  }
  
  if (requireAdmin) {
    if (role !== 'admin') {
      if (checkBackend) {
        try {
          const response = await authenticatedFetch('/user/adminCheck');
          if (!response.ok) {
            window.location.href = '../login.html';
            return false;
          }
        } catch {
          window.location.href = '../login.html';
          return false;
        }
      } else {
        window.location.href = '../login.html';
        return false;
      }
    } else if (checkBackend) {
      try {
        const response = await authenticatedFetch('/user/adminCheck');
        if (!response.ok) {
          clearAuthData();
          window.location.href = '../login.html';
          return false;
        }
      } catch {
        clearAuthData();
        window.location.href = '../login.html';
        return false;
      }
    }
  } else if (checkBackend && userId) {
    try {
      const response = await authenticatedFetch(`/user/myAccount/${userId}`);
      if (response.status === 401 || response.status === 403) {
        return false;
      }
    } catch {
    }
  }
  
  return true;
}

window.Auth = {
  getToken,
  getUserId,
  getRole,
  hasToken,
  saveAuthData,
  clearAuthData,
  savePendingAction,
  getPendingAction,
  clearPendingAction,
  redirectToLogin,
  authenticatedFetch,
  resumePendingAction,
  requireAuth,
  isValidReturnUrl,
  getSafeReturnUrl,
  CONFIG: AUTH_CONFIG
};

console.log('Auth utility loaded');
