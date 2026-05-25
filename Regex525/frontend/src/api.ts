import { BuildResponse, MatchResult, RegexHistory, PresetScenario } from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function buildAutomaton(
  pattern: string,
  testText: string
): Promise<BuildResponse> {
  return request<BuildResponse>('/build', {
    method: 'POST',
    body: JSON.stringify({ pattern, testText })
  });
}

export async function matchPattern(
  pattern: string,
  testText: string,
  engine: 'nfa' | 'dfa' | 'minimized-dfa' = 'nfa'
): Promise<{ matchResult: MatchResult }> {
  return request<{ matchResult: MatchResult }>('/match', {
    method: 'POST',
    body: JSON.stringify({ pattern, testText, engine })
  });
}

export async function getPresets(): Promise<{ presets: PresetScenario[] }> {
  return request<{ presets: PresetScenario[] }>('/presets');
}

export async function getHistory(): Promise<{ history: RegexHistory[] }> {
  return request<{ history: RegexHistory[] }>('/history');
}

export async function deleteHistory(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/history/${id}`, {
    method: 'DELETE'
  });
}

export async function clearHistory(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/history', {
    method: 'DELETE'
  });
}
