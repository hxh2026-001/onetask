const API_BASE = '/api';

export async function getPresets() {
  const response = await fetch(`${API_BASE}/presets`);
  return await response.json();
}

export async function getPreset(type) {
  const response = await fetch(`${API_BASE}/presets/${type}`);
  return await response.json();
}

export async function savePreset(type) {
  const response = await fetch(`${API_BASE}/presets/${type}/save`, {
    method: 'POST'
  });
  return await response.json();
}

export async function solveConstraints(elements, constraints, sceneId = null, saveToHistory = true) {
  const response = await fetch(`${API_BASE}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements, constraints, sceneId, saveToHistory })
  });
  return await response.json();
}

export async function analyzeConstraints(elements, constraints) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements, constraints })
  });
  return await response.json();
}

export async function getScenes() {
  const response = await fetch(`${API_BASE}/scenes`);
  return await response.json();
}

export async function getScene(id) {
  const response = await fetch(`${API_BASE}/scenes/${id}`);
  return await response.json();
}

export async function saveScene(scene) {
  const response = await fetch(`${API_BASE}/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scene)
  });
  return await response.json();
}

export async function deleteScene(id) {
  const response = await fetch(`${API_BASE}/scenes/${id}`, {
    method: 'DELETE'
  });
  return await response.json();
}

export async function getSolveHistory(sceneId) {
  const response = await fetch(`${API_BASE}/scenes/${sceneId}/history`);
  return await response.json();
}

export async function clearSolveHistory(sceneId) {
  const response = await fetch(`${API_BASE}/scenes/${sceneId}/history`, {
    method: 'DELETE'
  });
  return await response.json();
}

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch (e) {
    return null;
  }
}
