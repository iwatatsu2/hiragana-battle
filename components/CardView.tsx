'use client';

import Image from 'next/image';
import { Card } from '@/lib/types';
import { ATTR_NAMES, ATTR_COLORS, ATTR_TEXT_COLORS } from '@/lib/cards';

interface CardViewProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  showStats?: boolean;
  currentHp?: number;
}

export default function CardView({ card, size = 'md', selected, onClick, showStats = true, currentHp }: CardViewProps) {
  const sizes = {
    sm: 'w-20 h-28 text-xs',
    md: 'w-28 h-40 text-sm',
    lg: 'w-36 h-52 text-base',
  };

  const imgSizes = {
    sm: { w: 40, h: 40 },
    md: { w: 64, h: 64 },
    lg: { w: 80, h: 80 },
  };

  const rarityStyles = {
    SR: 'border-2 border-transparent bg-clip-padding sr-card',
    R: 'border-2 border-yellow-400 r-card',
    N: 'border border-gray-600',
  };

  const hp = currentHp ?? card.hp;
  const hpPercent = Math.max(0, (hp / card.hp) * 100);
  const imgId = String(card.id).padStart(3, '0');

  return (
    <div
      onClick={onClick}
      className={`
        ${sizes[size]} ${rarityStyles[card.rarity]}
        rounded-xl p-1.5 flex flex-col items-center justify-between
        ${card.rarity === 'SR' ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900' : card.rarity === 'R' ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800' : 'bg-gray-800'}
        ${selected ? 'ring-3 ring-cyan-400 scale-105' : ''}
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
        transition-all duration-200 relative overflow-hidden select-none
      `}
    >
      {card.rarity === 'SR' && (
        <div className="absolute inset-0 sr-shimmer pointer-events-none" />
      )}
      {card.rarity === 'R' && (
        <div className="absolute inset-0 r-shimmer pointer-events-none" />
      )}

      <div className="flex justify-between w-full items-center relative z-10">
        <span className={`${ATTR_COLORS[card.attr]} text-white px-1 rounded text-[10px] font-bold`}>
          {ATTR_NAMES[card.attr]}
        </span>
        <span className={`text-[10px] font-bold ${card.rarity === 'SR' ? 'text-purple-300' : card.rarity === 'R' ? 'text-yellow-300' : 'text-gray-400'}`}>
          {card.rarity}
        </span>
      </div>

      <div className="relative z-10">
        <Image
          src={`/monsters/monster_${imgId}.png`}
          alt={card.name}
          width={imgSizes[size].w}
          height={imgSizes[size].h}
          className="object-contain drop-shadow-lg"
          unoptimized
        />
      </div>

      <div className="w-full text-center relative z-10">
        <div className={`font-bold truncate ${ATTR_TEXT_COLORS[card.attr]} ${size === 'sm' ? 'text-[9px]' : 'text-[11px]'}`}>
          {card.name}
        </div>

        {showStats && size !== 'sm' && (
          <>
            {currentHp !== undefined && (
              <div className="w-full h-1.5 bg-gray-700 rounded-full mt-0.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            )}
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>HP{hp}</span>
              <span>ATK{card.atk}</span>
              <span>SPD{card.spd}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
