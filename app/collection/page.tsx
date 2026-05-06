'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CardView from '@/components/CardView';
import { Card, Attribute } from '@/lib/types';
import { CARDS, ATTR_NAMES, ATTR_COLORS, getCardById } from '@/lib/cards';
import { loadData } from '@/lib/storage';

export default function CollectionPage() {
  const [gotIds, setGotIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | Attribute>('all');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    setGotIds(loadData().gotCards);
  }, []);

  const attrs: ('all' | Attribute)[] = ['all', 'fire', 'water', 'grass', 'thunder', 'dark', 'light'];

  const filtered = CARDS.filter(c => {
    if (filter !== 'all' && c.attr !== filter) return false;
    return true;
  });

  const owned = filtered.filter(c => gotIds.includes(c.id));
  const total = filtered.length;

  return (
    <div className="min-h-dvh flex flex-col p-4">
      <div className="flex items-center justify-between mb-3">
        <Link href="/" className="text-gray-400 text-sm">← もどる</Link>
        <h1 className="text-lg font-bold">📖 カードずかん</h1>
        <div className="text-sm text-cyan-400">{owned.length}/{total}</div>
      </div>

      {/* フィルター */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {attrs.map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              filter === a
                ? a === 'all' ? 'bg-white text-black' : `${ATTR_COLORS[a]} text-white`
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {a === 'all' ? 'すべて' : ATTR_NAMES[a]}
          </button>
        ))}
      </div>

      {/* カード一覧 */}
      <div className="grid grid-cols-4 gap-2 flex-1 overflow-y-auto pb-4">
        {filtered.map(card => {
          const has = gotIds.includes(card.id);
          return (
            <div key={card.id} className={!has ? 'opacity-30 grayscale' : ''}>
              <CardView
                card={card}
                size="sm"
                onClick={() => has && setSelectedCard(card)}
              />
            </div>
          );
        })}
      </div>

      {/* カード詳細モーダル */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-6 max-w-xs w-full fade-in flex flex-col items-center gap-3"
            onClick={e => e.stopPropagation()}
          >
            <CardView card={selectedCard} size="lg" showStats />
            <div className="text-center space-y-1">
              <div className="font-bold text-lg">{selectedCard.name}</div>
              <div className={`text-sm ${ATTR_COLORS[selectedCard.attr]} text-white px-2 py-0.5 rounded inline-block`}>
                {ATTR_NAMES[selectedCard.attr]}
              </div>
              <div className="text-xs text-gray-400">
                {selectedCard.rarity === 'SR' ? '★★★ スーパーレア' : selectedCard.rarity === 'R' ? '★★ レア' : '★ ノーマル'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-gray-500 text-xs">HP</div>
                <div className="font-bold text-green-400">{selectedCard.hp}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">こうげき</div>
                <div className="font-bold text-red-400">{selectedCard.atk}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">すばやさ</div>
                <div className="font-bold text-blue-400">{selectedCard.spd}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">とくぎ</div>
              <div className="font-bold text-purple-400">{selectedCard.skill}</div>
            </div>
            <button
              onClick={() => setSelectedCard(null)}
              className="w-full py-2 rounded-lg bg-gray-700 text-sm font-bold active:scale-95 transition-all"
            >
              とじる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
