'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { generateNumberQuiz, NumberQuiz, NUMBERS } from '@/lib/numbers';
import { addTickets, loadData } from '@/lib/storage';

type GamePhase = 'menu' | 'playing' | 'result';

export default function NumbersPage() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [quiz, setQuiz] = useState<NumberQuiz | null>(null);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(10);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const [tickets, setTickets] = useState(0);

  useEffect(() => {
    setTickets(loadData().tickets);
  }, []);

  const startGame = () => {
    setPhase('playing');
    setScore(0);
    setRound(0);
    setCombo(0);
    setMaxCombo(0);
    nextQuiz();
  };

  const nextQuiz = () => {
    setQuiz(generateNumberQuiz());
    setAnswered(null);
    setShowNext(false);
    setRound(prev => prev + 1);
  };

  const handleAnswer = (choiceIndex: number) => {
    if (answered !== null || !quiz) return;
    setAnswered(choiceIndex);

    const correct = choiceIndex === quiz.correctIndex;
    if (correct) {
      setScore(prev => prev + 1);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(mc => Math.max(mc, newCombo));
        return newCombo;
      });
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      if (round >= totalRounds) {
        // ゲーム終了
        const finalScore = score + (correct ? 1 : 0);
        const earnedTickets = finalScore >= 8 ? 3 : finalScore >= 5 ? 2 : finalScore >= 3 ? 1 : 0;
        if (earnedTickets > 0) {
          const data = addTickets(earnedTickets);
          setTickets(data.tickets);
        }
        setPhase('result');
      } else {
        setShowNext(true);
      }
    }, 800);
  };

  // メニュー画面
  if (phase === 'menu') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
        <Link href="/" className="absolute top-4 left-4 text-gray-400 text-sm">← もどる</Link>

        <div className="text-center fade-in">
          <div className="text-6xl mb-3">🔢</div>
          <h1 className="text-3xl font-bold text-yellow-400">すうじゲーム</h1>
          <p className="text-gray-400 text-sm mt-1">1〜10の すうじを おぼえよう！</p>
        </div>

        {/* 数字プレビュー */}
        <div className="grid grid-cols-5 gap-2 max-w-xs">
          {NUMBERS.map(n => (
            <div key={n.number} className="bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-2xl">{n.emoji}</div>
              <div className="text-lg font-bold text-white">{n.number}</div>
              <div className="text-[10px] text-gray-400">{n.word}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={startGame}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg active:scale-95 transition-all shadow-lg"
          >
            🎮 スタート！（{totalRounds}もん）
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          <div>3もん せいかい → 🎫 ×1</div>
          <div>5もん せいかい → 🎫 ×2</div>
          <div>8もん せいかい → 🎫 ×3</div>
        </div>
      </div>
    );
  }

  // プレイ画面
  if (phase === 'playing' && quiz) {
    const isCorrect = answered !== null && answered === quiz.correctIndex;
    const isWrong = answered !== null && answered !== quiz.correctIndex;

    return (
      <div className="min-h-dvh flex flex-col p-4 gap-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">{round}/{totalRounds}</div>
          <div className="flex gap-1">
            {Array.from({ length: totalRounds }, (_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${
                i < round - 1 ? (i < score ? 'bg-green-500' : 'bg-red-500') :
                i === round - 1 ? 'bg-yellow-400' : 'bg-gray-700'
              }`} />
            ))}
          </div>
          <div className="text-sm">
            {combo > 1 && <span className="text-orange-400 font-bold">{combo}コンボ🔥</span>}
          </div>
        </div>

        {/* 問題 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm text-center">
            {quiz.mode === 'count' && (
              <>
                <div className="text-sm text-cyan-400 mb-2">いくつ あるかな？</div>
                <div className="text-4xl leading-relaxed tracking-wider">{quiz.displayText}</div>
              </>
            )}
            {quiz.mode === 'read' && (
              <>
                <div className="text-sm text-cyan-400 mb-2">この すうじは なに？</div>
                <div className="text-7xl font-bold text-yellow-400">{quiz.displayText}</div>
                <div className="text-sm text-gray-400 mt-2">すうじを タップしてね</div>
              </>
            )}
            {quiz.mode === 'order' && (
              <>
                <div className="text-sm text-cyan-400 mb-2">どっちが おおきい？</div>
                <div className="text-5xl font-bold">
                  <span className="text-blue-400">{quiz.displayText.split(' と ')[0]}</span>
                  <span className="text-gray-500 text-2xl mx-2">と</span>
                  <span className="text-red-400">{quiz.displayText.split(' と ')[1]}</span>
                </div>
              </>
            )}
          </div>

          {/* 正解/不正解表示 */}
          {answered !== null && (
            <div className={`text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'} fade-in`}>
              {isCorrect ? '⭕ せいかい！' : `❌ こたえは ${quiz.choices[quiz.correctIndex]}（${quiz.question.word}）`}
            </div>
          )}

          {/* 選択肢 */}
          <div className={`grid ${quiz.mode === 'order' ? 'grid-cols-2' : 'grid-cols-2'} gap-3 w-full max-w-sm`}>
            {quiz.choices.map((choice, i) => {
              const num = NUMBERS.find(n => n.number === choice);
              let btnClass = 'bg-gray-700 hover:bg-gray-600 active:scale-95';
              if (answered !== null) {
                if (i === quiz.correctIndex) btnClass = 'bg-green-600 scale-105';
                else if (i === answered) btnClass = 'bg-red-600 shake';
                else btnClass = 'bg-gray-800 opacity-50';
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered !== null}
                  className={`py-5 rounded-xl font-bold transition-all ${btnClass}`}
                >
                  <div className="text-3xl">{choice}</div>
                  {num && <div className="text-xs text-gray-300 mt-1">{num.word}</div>}
                </button>
              );
            })}
          </div>

          {/* つぎへボタン */}
          {showNext && (
            <button
              onClick={nextQuiz}
              className="py-3 px-8 rounded-xl bg-blue-600 font-bold text-lg active:scale-95 transition-all fade-in"
            >
              つぎへ →
            </button>
          )}
        </div>
      </div>
    );
  }

  // 結果画面
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-6xl">{score >= 8 ? '🏆' : score >= 5 ? '🎉' : score >= 3 ? '😊' : '😢'}</div>

      <h1 className="text-3xl font-bold text-yellow-400">
        {score >= 8 ? 'すごい！' : score >= 5 ? 'よくできた！' : score >= 3 ? 'がんばったね！' : 'またやろう！'}
      </h1>

      <div className="bg-gray-800 rounded-xl p-5 text-center space-y-2">
        <div className="text-4xl font-bold text-cyan-400">{score}/{totalRounds}</div>
        <div className="text-sm text-gray-400">せいかい</div>
        {maxCombo > 1 && (
          <div className="text-orange-400 font-bold text-sm">さいこう {maxCombo}コンボ🔥</div>
        )}
      </div>

      {/* ごほうび */}
      {score >= 3 && (
        <div className="bg-gray-800 rounded-xl p-4 text-center fade-in">
          <div className="text-sm text-gray-400">ごほうび</div>
          <div className="text-xl font-bold text-yellow-400">
            🎫 ×{score >= 8 ? 3 : score >= 5 ? 2 : 1} ガチャチケット
          </div>
        </div>
      )}

      {/* 数字の星 */}
      <div className="flex gap-1">
        {Array.from({ length: totalRounds }, (_, i) => (
          <div key={i} className={`text-2xl ${i < score ? '' : 'grayscale opacity-30'}`}>⭐</div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={startGame}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 font-bold text-lg active:scale-95 transition-all"
        >
          もういちど あそぶ
        </button>
        <Link href="/" className="block">
          <button className="w-full py-3 rounded-xl bg-gray-700 font-bold active:scale-95 transition-all">
            タイトルへ
          </button>
        </Link>
        {score >= 3 && (
          <Link href="/gacha" className="block">
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 font-bold active:scale-95 transition-all">
              🎰 ガチャをひく（🎫 {tickets}まい）
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
