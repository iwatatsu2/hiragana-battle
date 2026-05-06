import { BattleMonster, Card, Difficulty, Attribute } from './types';
import { CARDS, ATTR_ADVANTAGE } from './cards';

export function createBattleMonster(card: Card): BattleMonster {
  return { card, currentHp: card.hp, isActive: true };
}

export function getTypeMultiplier(attackerAttr: Attribute, defenderAttr: Attribute): number {
  const advantages = ATTR_ADVANTAGE[attackerAttr] || [];
  if (advantages.includes(defenderAttr)) return 1.5;
  // 逆の場合は不利
  const defAdvantages = ATTR_ADVANTAGE[defenderAttr] || [];
  if (defAdvantages.includes(attackerAttr)) return 0.5;
  return 1.0;
}

export function calcDamage(
  attacker: BattleMonster,
  defender: BattleMonster,
  isSkill: boolean
): { damage: number; multiplier: number } {
  const base = attacker.card.atk;
  const multiplier = getTypeMultiplier(attacker.card.attr, defender.card.attr);
  const skillBonus = isSkill ? 1.5 : 1.0;
  const randomFactor = 0.85 + Math.random() * 0.3;
  const damage = Math.max(1, Math.floor(base * multiplier * skillBonus * randomFactor * 0.5));
  return { damage, multiplier };
}

export function generateCpuTeam(difficulty: Difficulty, excludeIds: number[] = []): Card[] {
  let pool: Card[];
  switch (difficulty) {
    case 'easy':
      pool = CARDS.filter(c => c.rarity === 'N' && !excludeIds.includes(c.id));
      break;
    case 'normal':
      pool = CARDS.filter(c => (c.rarity === 'N' || c.rarity === 'R') && !excludeIds.includes(c.id));
      break;
    case 'hard':
      pool = CARDS.filter(c => !excludeIds.includes(c.id));
      break;
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function cpuChooseAction(
  cpuActive: BattleMonster,
  playerActive: BattleMonster,
  cpuTeam: BattleMonster[],
  difficulty: Difficulty
): { action: 'attack' | 'skill' | 'switch'; switchIndex?: number } {
  const aliveTeam = cpuTeam.filter(m => m.currentHp > 0 && m !== cpuActive);

  if (difficulty === 'easy') {
    // やさしい: ランダム行動
    const r = Math.random();
    if (r < 0.6) return { action: 'attack' };
    if (r < 0.9) return { action: 'skill' };
    if (aliveTeam.length > 0) {
      const idx = cpuTeam.indexOf(aliveTeam[Math.floor(Math.random() * aliveTeam.length)]);
      return { action: 'switch', switchIndex: idx };
    }
    return { action: 'attack' };
  }

  // ふつう・つよい: 属性不利なら交代を考慮
  const mult = getTypeMultiplier(cpuActive.card.attr, playerActive.card.attr);
  if (mult < 1 && aliveTeam.length > 0 && Math.random() < (difficulty === 'hard' ? 0.7 : 0.4)) {
    // 有利な属性のモンスターを探す
    const better = aliveTeam.find(m => getTypeMultiplier(m.card.attr, playerActive.card.attr) > 1);
    if (better) {
      return { action: 'switch', switchIndex: cpuTeam.indexOf(better) };
    }
  }

  // スキル使用
  if (Math.random() < (difficulty === 'hard' ? 0.5 : 0.3)) {
    return { action: 'skill' };
  }

  return { action: 'attack' };
}
