'use client';

import Link from 'next/link';
import Image from 'next/image';

const LINKS = [
  { icon: '🌐', label: '公式サイト', url: 'https://driwatatsu.readdy.co' },
  { icon: '🏥', label: '医療アプリまとめ', url: 'https://medapp-market.vercel.app' },
  { icon: '📷', label: 'Instagram', url: 'https://www.instagram.com/dr.iwatatsu/' },
  { icon: '𝕏', label: 'X (Twitter)', url: 'https://x.com/KenKyu1019799' },
  { icon: '📝', label: 'note', url: 'https://note.com/dr_iwatatsu' },
  { icon: '📊', label: 'antaaスライド', url: 'https://slide.antaa.jp/profile/mtzDnleJ6DYJ' },
];

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-950 text-white p-4">
      <div className="max-w-md mx-auto">
        {/* 戻るボタン */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          ← もどる
        </Link>

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <Image src="/dr-iwatatsu.png" alt="Dr.いわたつ" width={80} height={80} className="rounded-full border-2 border-gray-700 mx-auto bg-gray-800" />
          <h1 className="text-2xl font-bold mt-3">Dr. いわたつ</h1>
          <p className="text-sm text-gray-400 mt-1">岩本 達也</p>
          <p className="text-sm text-gray-500 mt-1">糖尿病・内分泌 専門医・指導医</p>
        </div>

        {/* 自己紹介 */}
        <div className="bg-gray-800/50 rounded-2xl p-5 mb-6 border border-gray-700/50">
          <p className="text-sm leading-relaxed text-gray-300">
            糖尿病・内分泌の専門医として日々診療に取り組みながら、「現場で本当に使えるツールを自分の手で作る」をモットーにWebアプリを開発しています。
          </p>
          <p className="text-sm leading-relaxed text-gray-300 mt-3">
            医療者向けの計算ツールから、子どもの学習・生活習慣づくりに役立つアプリまで、すべて無料で公開中。2児の父として、子どもたちの「できた！」を増やすアプリづくりにも力を入れています。
          </p>
        </div>

        {/* リンク */}
        <div className="space-y-2">
          {LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-3.5 text-sm hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-lg">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
              <span className="ml-auto text-gray-500">→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
