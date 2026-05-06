export type Attribute = 'fire' | 'water' | 'grass' | 'thunder' | 'dark' | 'light';
export type Rarity = 'N' | 'R' | 'SR';

export interface Card {
  id: number;
  name: string;
  emoji: string;
  attr: Attribute;
  rarity: Rarity;
  hp: number;
  atk: number;
  spd: number;
  skill: string;
}

export interface BattleMonster {
  card: Card;
  currentHp: number;
  isActive: boolean;
}

export interface SaveData {
  tickets: number;
  gotCards: number[];
  wins: number;
  losses: number;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export type BattleAction = 'attack' | 'skill' | 'switch';

export interface BattleLog {
  message: string;
  type: 'damage' | 'heal' | 'info' | 'ko';
}
