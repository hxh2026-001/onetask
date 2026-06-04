const BASE_URL = '/api';

const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const getSessionId = () => sessionId;

export const healthCheck = async () => {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
};

export const initSession = async (studentName = '匿名学生') => {
  const res = await fetch(`${BASE_URL}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, studentName })
  });
  return res.json();
};

export const calculate = async (data) => {
  const res = await fetch(`${BASE_URL}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, sessionId })
  });
  return res.json();
};

export const simplify = async (numerator, denominator, snapshot = null) => {
  const res = await fetch(`${BASE_URL}/simplify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numerator, denominator, sessionId, snapshot })
  });
  return res.json();
};

export const getHistory = async (limit = 50) => {
  const res = await fetch(`${BASE_URL}/history/${sessionId}?limit=${limit}`);
  return res.json();
};

export const getPresets = async () => {
  const res = await fetch(`${BASE_URL}/presets`);
  return res.json();
};

export const validateDrag = async (data) => {
  const res = await fetch(`${BASE_URL}/validate-drag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, sessionId })
  });
  return res.json();
};

export const saveOperation = async (operationType, data = {}) => {
  const res = await fetch(`${BASE_URL}/operation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, sessionId, operationType })
  });
  return res.json();
};
