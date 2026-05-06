'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import CardView from '@/components/CardView';
import { Card, SaveData } from '@/lib/types';
import { CARDS } from '@/lib/cards';
import { loadData, useTickets, addCard } from '@/lib/storage';

export default function GachaPage() {
  const [data, setData] = useState<SaveData | null>(null);
  const [result, setResult] = useState<Card | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    setData(loadData());
  }, []);

  const doGacha = () => {
    if (!data || data.tickets < 1) return;
    const updated = useTickets(1);
    if (!updated) return;

    // レアリティ抽選
    const r = Math.random();
    let rarity: 'N' | 'R' | 'SR';
    if (r < 0.1) rarity = 'SR';
    else if (r < 0.4) rarity = 'R';
    else rarity = 'N';

    const pool = CARDS.filter(c => c.rarity === rarity);
    const card = pool[Math.floor(Math.random() * pool.length)];

    const wasNew = !updated.gotCards.includes(card.id);
    const final = addCard(card.id);
    setData(final);
    setIsNew(wasNew);

    // 演出
    setRevealing(true);
    setResult(null);

    setTimeout(() => {
      setResult(card);
      setRevealing(false);

      // SR/Rなら紙吹雪
      if (card.rarity === 'SR' || card.rarity === 'R') {
        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bcb', '#c084fc'];
        const particles = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 1,
        }));
        setConfetti(particles);
        setTimeout(() => setConfetti([]), 4000);
      }
    }, 800);
  };

  if (!data) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 gap-6 relative">
      {/* 紙吹雪 */}
      {confetti.map(p => (
        <div
          key={p.id}
          className="confetti"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <Link href="/" className="absolute top-4 left-4 text-gray-400 text-sm">← もどる</Link>

      <h1 className="text-2xl font-bold">🎰 ガチャ</h1>

      <div className="text-yellow-400 font-bold">
        🎫 {data.tickets}まい
      </div>

      {/* 結果表示エリア */}
      <div className="w-40 h-56 flex items-center justify-center">
        {revealing ? (
          <div className="w-28 h-40 bg-gray-700 rounded-xl animate-pulse flex items-center justify-center text-3xl">
            ❓
          </div>
        ) : result ? (
          <div className="gacha-reveal flex flex-col items-center gap-2">
            <CardView card={result} size="lg" />
            {isNew && (
              <div className="text-cyan-400 font-bold text-sm animate-bounce">NEW!</div>
            )}
            {!isNew && (
              <div className="text-gray-500 text-xs">もっている カード</div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 text-sm">ガチャを ひこう！</div>
        )}
      </div>

      {/* ガチャボタン */}
      <button
        onClick={doGacha}
        disabled={data.tickets < 1}
        className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg transition-all ${
          data.tickets >= 1
            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 active:scale-95 hover:from-yellow-500 hover:to-orange-500'
            : 'bg-gray-700 text-gray-500'
        }`}
      >
        {data.tickets >= 1 ? '🎫 1まい つかって ひく！' : 'チケットが ないよ...'}
      </button>

      {/* 確率表示 */}
      <div className="text-xs text-gray-500 space-y-0.5 text-center">
        <div>SR(きんきら): 10% / R(きん): 30% / N: 60%</div>
        <div>バトルに かって チケットをもらおう！</div>
      </div>
    </div>
  );
}
