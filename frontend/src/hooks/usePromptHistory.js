import { useState, useEffect } from 'react';

const STORAGE_KEY = 'prompt_history';
const MAX_ITEMS = 50;

export default function usePromptHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [index, setIndex] = useState(-1);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_ITEMS)));
    } catch {
      // ignore write errors (e.g., storage disabled)
    }
  }, [history]);

  const addPrompt = (text) => {
    if (!text) return;
    setHistory((prev) => [...prev, text].slice(-MAX_ITEMS));
    setIndex(-1);
  };

  const previous = () => {
    if (history.length === 0) return null;
    const newIndex = index < 0 ? history.length - 1 : Math.max(index - 1, 0);
    setIndex(newIndex);
    return history[newIndex] || '';
  };

  const next = () => {
    if (history.length === 0) return '';
    let newIndex = index + 1;
    if (newIndex >= history.length) {
      setIndex(history.length);
      return '';
    }
    setIndex(newIndex);
    return history[newIndex] || '';
  };

  const resetNavigation = () => setIndex(-1);

  return {
    history,
    index,
    addPrompt,
    previous,
    next,
    resetNavigation,
  };
}
