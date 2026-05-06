'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadData } from '@/lib/storage';
import { SaveData } from '@/lib/types';

export default function Home() {
  const [data, setData] = useState<SaveData | null>(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  if (!data) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh p-4 gap-6">
      {/* タイトル */}
      <div className="text-center fade-in">
        <div className="text-6xl mb-2">⚔️</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
          ひらがなバトル
        </h1>
        <p className="text-gray-400 text-sm mt-1">Dr.いわたつ プロデュース</p>
      </div>

      {/* ステータス */}
      <div className="flex gap-4 text-sm text-gray-300">
        <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-gray-500">カード</div>
          <div className="font-bold text-cyan-400">{data.gotCards.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-gray-500">チケット</div>
          <div className="font-bold text-yellow-400">{data.tickets}</div>
        </div>
        <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-gray-500">しょうりつ</div>
          <div className="font-bold text-green-400">
            {data.wins + data.losses > 0
              ? `${Math.round((data.wins / (data.wins + data.losses)) * 100)}%`
              : '-'}
          </div>
        </div>
      </div>

      {/* メニュー */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link href="/battle" className="block">
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:from-blue-500 hover:to-purple-500 active:scale-95 transition-all shadow-lg shadow-blue-900/50">
            ⚔️ バトル
          </button>
        </Link>
        <Link href="/gacha" className="block">
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold text-lg hover:from-yellow-500 hover:to-orange-500 active:scale-95 transition-all shadow-lg shadow-yellow-900/50">
            🎰 ガチャ
            <span className="text-xs ml-2 opacity-80">({data.tickets}まい)</span>
          </button>
        </Link>
        <Link href="/numbers" className="block">
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white font-bold text-lg hover:from-pink-500 hover:to-rose-400 active:scale-95 transition-all shadow-lg shadow-pink-900/50">
            🔢 すうじゲーム
          </button>
        </Link>
        <Link href="/collection" className="block">
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg hover:from-green-500 hover:to-teal-500 active:scale-95 transition-all shadow-lg shadow-green-900/50">
            📖 ずかん
          </button>
        </Link>
      </div>

      {/* リンク */}
      <a
        href="https://hiragana-app-ten.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors mt-4"
      >
        ひらがなますたー にもどる →
      </a>
    </div>
  );
}
