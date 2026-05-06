'use client';

import { SaveData } from './types';
import { CARDS } from './cards';

const STORAGE_KEY = 'hiraganaBattleV1';

const DEFAULT_DATA: SaveData = {
  tickets: 0,
  gotCards: [],
  wins: 0,
  losses: 0,
};

export function loadData(): SaveData {
  if (typeof window === 'undefined') return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initStarterDeck();
    return JSON.parse(raw);
  } catch {
    return initStarterDeck();
  }
}

export function saveData(data: SaveData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initStarterDeck(): SaveData {
  // ランダムにN 5枚配布
  const nCards = CARDS.filter(c => c.rarity === 'N');
  const shuffled = [...nCards].sort(() => Math.random() - 0.5);
  const starter = shuffled.slice(0, 5).map(c => c.id);
  const data: SaveData = { ...DEFAULT_DATA, gotCards: starter, tickets: 3 };
  saveData(data);
  return data;
}

export function addCard(cardId: number): SaveData {
  const data = loadData();
  if (!data.gotCards.includes(cardId)) {
    data.gotCards.push(cardId);
  }
  saveData(data);
  return data;
}

export function addTickets(count: number): SaveData {
  const data = loadData();
  data.tickets += count;
  saveData(data);
  return data;
}

export function useTickets(count: number): SaveData | null {
  const data = loadData();
  if (data.tickets < count) return null;
  data.tickets -= count;
  saveData(data);
  return data;
}

export function recordWin(): SaveData {
  const data = loadData();
  data.wins++;
  data.tickets += 3;
  saveData(data);
  return data;
}

export function recordLoss(): SaveData {
  const data = loadData();
  data.losses++;
  saveData(data);
  return data;
}
