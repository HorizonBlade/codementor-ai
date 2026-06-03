export const languages = [
  { id: 'python', name: 'Python', monacoId: 'python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', monacoId: 'javascript', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', monacoId: 'typescript', icon: '🔷' },
  { id: 'java', name: 'Java', monacoId: 'java', icon: '☕' },
  { id: 'cpp', name: 'C++', monacoId: 'cpp', icon: '⚙️' },
  { id: 'csharp', name: 'C#', monacoId: 'csharp', icon: '🟪' },
  { id: 'go', name: 'Go', monacoId: 'go', icon: '🐹' },
  { id: 'rust', name: 'Rust', monacoId: 'rust', icon: '🦀' },
];

export const difficulties = [
  { id: 'newbie', name: 'Newbie', color: '#6b7280', time: '5-10 min', xp: 10 },
  { id: 'easy', name: 'Easy', color: '#22c55e', time: '10-15 min', xp: 25 },
  { id: 'medium', name: 'Medium', color: '#f59e0b', time: '15-25 min', xp: 50 },
  { id: 'hard', name: 'Hard', color: '#ef4444', time: '25-40 min', xp: 100 },
  { id: 'expert', name: 'Expert', color: '#a855f7', time: '40-60 min', xp: 200 },
];

export const topics = [
  'arrays', 'strings', 'hash-table', 'linked-list', 'stack', 'queue',
  'tree', 'graph', 'binary-search', 'sorting', 'dynamic-programming',
  'greedy', 'backtracking', 'recursion', 'math', 'bit-manipulation',
  'two-pointers', 'sliding-window', 'heap', 'trie',
];

export function getLanguageById(id) {
  return languages.find((l) => l.id === id) || languages[0];
}

export function getDifficultyById(id) {
  return difficulties.find((d) => d.id === id) || difficulties[1];
}
