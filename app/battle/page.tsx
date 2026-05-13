'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CardView from '@/components/CardView';
import { Card, BattleMonster, Difficulty, BattleLog } from '@/lib/types';
import { getCardById } from '@/lib/cards';
import { createBattleMonster, calcDamage, generateCpuTeam, cpuChooseAction } from '@/lib/battle';
import { loadData, recordWin, recordLoss } from '@/lib/storage';
import { HiraganaQuiz, generateQuiz } from '@/lib/hiragana';

type Phase = 'select' | 'difficulty' | 'battle' | 'result';

export default function BattlePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [playerTeam, setPlayerTeam] = useState<BattleMonster[]>([]);
  const [cpuTeam, setCpuTeam] = useState<BattleMonster[]>([]);
  const [playerActive, setPlayerActive] = useState(0);
  const [cpuActive, setCpuActive] = useState(0);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleOver, setBattleOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [shakeCpu, setShakeCpu] = useState(false);
  const [damagePopPlayer, setDamagePopPlayer] = useState<number | null>(null);
  const [damagePopCpu, setDamagePopCpu] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // ひらがなクイズ状態
  const [quiz, setQuiz] = useState<HiraganaQuiz | null>(null);
  const [pendingAction, setPendingAction] = useState<'attack' | 'skill' | null>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    const data = loadData();
    const cards = data.gotCards.map(id => getCardById(id)).filter(Boolean) as Card[];
    setMyCards(cards);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((message: string, type: BattleLog['type'] = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const startBattle = (diff: Difficulty) => {
    setDifficulty(diff);
    const pTeam = selectedIds.map(id => createBattleMonster(getCardById(id)!));
    const cpuCards = generateCpuTeam(diff);
    const cTeam = cpuCards.map(c => createBattleMonster(c));

    setPlayerTeam(pTeam);
    setCpuTeam(cTeam);
    setPlayerActive(0);
    setCpuActive(0);
    setLogs([]);
    setBattleOver(false);
    setQuizScore({ correct: 0, total: 0 });

    const playerFirst = pTeam[0].card.spd >= cTeam[0].card.spd;
    setIsPlayerTurn(playerFirst);
    setPhase('battle');

    addLog('バトルスタート！');
    if (!playerFirst) {
      setTimeout(() => doCpuTurn(pTeam, cTeam, 0, 0, diff), 1000);
    }
  };

  const doAttack = (attacker: BattleMonster, defender: BattleMonster, isSkill: boolean, isPlayer: boolean, quizBoost: boolean = false) => {
    const { damage: baseDamage, multiplier } = calcDamage(attacker, defender, isSkill);
    const finalDamage = quizBoost ? Math.floor(baseDamage * 1.5) : baseDamage;
    defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

    const actionName = isSkill ? attacker.card.skill : 'こうげき';
    let msg = `${attacker.card.name}の ${actionName}！ ${finalDamage}ダメージ！`;
    if (quizBoost) msg += ' ひらがなブースト！';
    if (multiplier > 1) msg += ' こうかばつぐん！';
    if (multiplier < 1) msg += ' こうかいまひとつ...';

    addLog(msg, 'damage');

    if (isPlayer) {
      setShakeCpu(true);
      setDamagePopCpu(finalDamage);
      setTimeout(() => { setShakeCpu(false); setDamagePopCpu(null); }, 500);
    } else {
      setShakePlayer(true);
      setDamagePopPlayer(finalDamage);
      setTimeout(() => { setShakePlayer(false); setDamagePopPlayer(null); }, 500);
    }

    if (defender.currentHp <= 0) {
      addLog(`${defender.card.name}は たおれた！`, 'ko');
    }

    return finalDamage;
  };

  const findNextAlive = (team: BattleMonster[], currentIdx: number): number => {
    for (let i = 0; i < team.length; i++) {
      if (i !== currentIdx && team[i].currentHp > 0) return i;
    }
    return -1;
  };

  // 音声読み上げ
  const speakWord = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'ja-JP';
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
  };

  // 1文字だけ読み上げ
  const speakChar = (char: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(char);
      u.lang = 'ja-JP';
      u.rate = 0.7;
      window.speechSynthesis.speak(u);
    }
  };

  // クイズ表示 → 回答後に攻撃実行
  const handlePlayerAction = (action: 'attack' | 'skill') => {
    if (!isPlayerTurn || battleOver || processing) return;
    setPendingAction(action);
    const q = generateQuiz();
    setQuiz(q);
    setQuizResult(null);
    // 少し待ってから読み上げ
    setTimeout(() => speakWord(q.question.word), 300);
  };

  const handleQuizAnswer = (choiceIndex: number) => {
    if (!quiz || !pendingAction) return;
    const correct = choiceIndex === quiz.correctIndex;
    setQuizResult(correct ? 'correct' : 'wrong');
    setQuizScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    if (correct) {
      addLog(`⭕ 「${quiz.question.word}」せいかい！ パワーアップ！`, 'info');
    } else {
      addLog(`❌ 「${quiz.question.emoji} ${quiz.question.word}」は「${quiz.question.char}」！`, 'info');
    }

    // 少し待ってから攻撃実行
    setTimeout(() => {
      executeAttack(pendingAction, correct);
      setQuiz(null);
      setPendingAction(null);
      setQuizResult(null);
    }, 800);
  };

  const executeAttack = (action: 'attack' | 'skill', quizCorrect: boolean) => {
    setProcessing(true);
    const pTeam = [...playerTeam];
    const cTeam = [...cpuTeam];
    const pIdx = playerActive;
    let cIdx = cpuActive;

    doAttack(pTeam[pIdx], cTeam[cIdx], action === 'skill', true, quizCorrect);

    if (cTeam[cIdx].currentHp <= 0) {
      const next = findNextAlive(cTeam, cIdx);
      if (next === -1) {
        setPlayerTeam(pTeam);
        setCpuTeam(cTeam);
        setBattleOver(true);
        setWon(true);
        recordWin();
        addLog('やった！ しょうり！', 'info');
        setPhase('result');
        setProcessing(false);
        return;
      }
      setCpuActive(next);
      cIdx = next;
      addLog(`あいての ${cTeam[next].card.name}が とうじょう！`, 'info');
    }

    setPlayerTeam([...pTeam]);
    setCpuTeam([...cTeam]);
    setIsPlayerTurn(false);

    setTimeout(() => doCpuTurn(pTeam, cTeam, pIdx, cIdx, difficulty), 1200);
  };

  const handleSwitch = (idx: number) => {
    if (!isPlayerTurn || battleOver || processing) return;
    if (playerTeam[idx].currentHp <= 0 || idx === playerActive) return;
    setProcessing(true);

    addLog(`${playerTeam[idx].card.name}に こうたい！`, 'info');
    setPlayerActive(idx);
    setIsPlayerTurn(false);

    setTimeout(() => doCpuTurn(playerTeam, cpuTeam, idx, cpuActive, difficulty), 1000);
  };

  const doCpuTurn = useCallback((pTeam: BattleMonster[], cTeam: BattleMonster[], pIdx: number, cIdx: number, diff: Difficulty) => {
    const result = cpuChooseAction(cTeam[cIdx], pTeam[pIdx], cTeam, diff);

    if (result.action === 'switch' && result.switchIndex !== undefined) {
      addLog(`あいては ${cTeam[result.switchIndex].card.name}に こうたい！`, 'info');
      setCpuActive(result.switchIndex);
    } else {
      doAttack(cTeam[cIdx], pTeam[pIdx], result.action === 'skill', false);

      if (pTeam[pIdx].currentHp <= 0) {
        const next = findNextAlive(pTeam, pIdx);
        if (next === -1) {
          setPlayerTeam([...pTeam]);
          setCpuTeam([...cTeam]);
          setBattleOver(true);
          setWon(false);
          recordLoss();
          addLog('ざんねん... まけてしまった', 'info');
          setPhase('result');
          setProcessing(false);
          return;
        }
        setPlayerActive(next);
        addLog(`${pTeam[next].card.name}が とうじょう！`, 'info');
      }
    }

    setPlayerTeam([...pTeam]);
    setCpuTeam([...cTeam]);
    setIsPlayerTurn(true);
    setProcessing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLog]);

  // チーム選択画面
  if (phase === 'select') {
    return (
      <div className="h-dvh p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <Link href="/" className="text-gray-400 text-sm">← もどる</Link>
          <h1 className="text-lg font-bold">チームをえらぼう（3たい）</h1>
          <div className="text-cyan-400 text-sm">{selectedIds.length}/3</div>
        </div>

        <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-1 min-h-0 content-start">
          {myCards.map(card => (
            <CardView
              key={card.id}
              card={card}
              size="sm"
              selected={selectedIds.includes(card.id)}
              onClick={() => toggleSelect(card.id)}
            />
          ))}
        </div>

        {myCards.length < 3 && (
          <div className="text-center text-yellow-400 text-sm my-2 shrink-0">
            カードが たりません。ガチャで ふやそう！
          </div>
        )}

        <button
          onClick={() => selectedIds.length === 3 && setPhase('difficulty')}
          disabled={selectedIds.length !== 3}
          className={`shrink-0 mt-2 py-4 rounded-xl font-bold text-lg transition-all ${
            selectedIds.length === 3
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 active:scale-95'
              : 'bg-gray-700 text-gray-500'
          }`}
        >
          つぎへ →
        </button>
      </div>
    );
  }

  // 難易度選択
  if (phase === 'difficulty') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 gap-4">
        <h1 className="text-2xl font-bold mb-4">むずかしさをえらぼう</h1>
        {([
          { key: 'easy' as Difficulty, label: 'やさしい', emoji: '😊', desc: 'はじめてでも あんしん', color: 'from-green-600 to-green-500' },
          { key: 'normal' as Difficulty, label: 'ふつう', emoji: '😤', desc: 'ちょっと つよい あいて', color: 'from-yellow-600 to-orange-500' },
          { key: 'hard' as Difficulty, label: 'つよい', emoji: '👹', desc: 'さいきょうの あいて！', color: 'from-red-600 to-red-500' },
        ]).map(d => (
          <button
            key={d.key}
            onClick={() => startBattle(d.key)}
            className={`w-full max-w-xs py-4 px-6 rounded-xl bg-gradient-to-r ${d.color} text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all`}
          >
            <span className="text-2xl mr-2">{d.emoji}</span>
            {d.label}
            <div className="text-xs font-normal opacity-80 mt-1">{d.desc}</div>
          </button>
        ))}
        <button onClick={() => setPhase('select')} className="text-gray-400 text-sm mt-4">← もどる</button>
      </div>
    );
  }

  // バトル画面
  if (phase === 'battle') {
    const pMon = playerTeam[playerActive];
    const cMon = cpuTeam[cpuActive];

    return (
      <div className="min-h-dvh flex flex-col p-2 gap-2 relative">
        {/* ひらがなクイズオーバーレイ */}
        {quiz && (
          <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full fade-in border border-cyan-800">
              <div className="text-center mb-4">
                <div className="text-xs text-cyan-400 mb-1">ひらがなクイズ！ せいかいで パワーアップ！</div>
                <div className="text-5xl mb-2">{quiz.question.emoji}</div>
                <div className="text-lg font-bold mb-2">
                  さいしょの もじは？
                </div>
                <button
                  onClick={() => speakWord(quiz.question.word)}
                  className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 active:scale-95 transition-all text-sm"
                >
                  🔊 もういちど きく
                </button>
              </div>

              {quizResult ? (
                <div className={`text-center text-3xl font-bold py-4 ${quizResult === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                  {quizResult === 'correct' ? '⭕ せいかい！' : `❌ こたえは「${quiz.question.char}」`}
                  {quizResult === 'correct' && (
                    <div className="text-sm text-cyan-400 mt-1">ダメージ 1.5ばい！</div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {quiz.choices.map((choice, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          speakChar(choice);
                          handleQuizAnswer(i);
                        }}
                        className="py-4 rounded-xl bg-gray-700 hover:bg-gray-600 active:scale-95 transition-all text-2xl font-bold flex flex-col items-center gap-1"
                      >
                        <span className="text-3xl">🔊</span>
                        <span className="text-xs text-gray-400">{i + 1}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-2">ボタンを おして おとを きいてね</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* CPU側 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {cpuTeam.map((m, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${m.currentHp > 0 ? 'bg-red-500' : 'bg-gray-700'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-400">あいて</span>
          </div>
          <div className="text-xs text-gray-500">
            ひらがな {quizScore.correct}/{quizScore.total}
          </div>
        </div>

        <div className={`flex justify-center relative ${shakeCpu ? 'shake' : ''}`}>
          <CardView card={cMon.card} size="lg" currentHp={cMon.currentHp} />
          {damagePopCpu !== null && (
            <div className="absolute top-0 right-4 text-red-400 font-bold text-2xl damage-pop">
              -{damagePopCpu}
            </div>
          )}
        </div>

        {/* ログ */}
        <div
          ref={logRef}
          className="bg-gray-900/80 rounded-lg p-2 h-20 overflow-y-auto text-xs space-y-0.5 border border-gray-700"
        >
          {logs.map((log, i) => (
            <div key={i} className={
              log.type === 'damage' ? 'text-orange-400' :
              log.type === 'ko' ? 'text-red-400 font-bold' : 'text-gray-300'
            }>
              {log.message}
            </div>
          ))}
        </div>

        {/* プレイヤー側 */}
        <div className={`flex justify-center relative ${shakePlayer ? 'shake' : ''}`}>
          <CardView card={pMon.card} size="lg" currentHp={pMon.currentHp} />
          {damagePopPlayer !== null && (
            <div className="absolute top-0 left-4 text-red-400 font-bold text-2xl damage-pop">
              -{damagePopPlayer}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {playerTeam.map((m, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${m.currentHp > 0 ? 'bg-cyan-500' : 'bg-gray-700'}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400">じぶん</span>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={() => handlePlayerAction('attack')}
            disabled={!isPlayerTurn || processing}
            className={`py-3 rounded-xl font-bold transition-all ${
              isPlayerTurn && !processing
                ? 'bg-blue-600 active:scale-95 pulse-glow'
                : 'bg-gray-700 text-gray-500'
            }`}
          >
            ⚔️ こうげき
          </button>
          <button
            onClick={() => handlePlayerAction('skill')}
            disabled={!isPlayerTurn || processing}
            className={`py-3 rounded-xl font-bold transition-all ${
              isPlayerTurn && !processing
                ? 'bg-purple-600 active:scale-95'
                : 'bg-gray-700 text-gray-500'
            }`}
          >
            ✨ {pMon.card.skill}
          </button>
        </div>

        {/* 交代ボタン */}
        <div className="flex gap-2">
          {playerTeam.map((m, i) => {
            const imgId = String(m.card.id).padStart(3, '0');
            return i !== playerActive ? (
              <button
                key={i}
                onClick={() => handleSwitch(i)}
                disabled={!isPlayerTurn || m.currentHp <= 0 || processing}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 justify-center ${
                  isPlayerTurn && m.currentHp > 0 && !processing
                    ? 'bg-gray-700 hover:bg-gray-600 active:scale-95'
                    : 'bg-gray-800 text-gray-600'
                }`}
              >
                <Image src={`/monsters/monster_${imgId}.png`} alt={m.card.name} width={24} height={24} className="object-contain" unoptimized />
                <div>
                  <div>{m.card.name}</div>
                  <div className="text-[10px] text-gray-400">HP {m.currentHp}/{m.card.hp}</div>
                </div>
              </button>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  // 結果画面
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-6xl">{won ? '🎉' : '😢'}</div>
      <h1 className={`text-3xl font-bold ${won ? 'text-yellow-400' : 'text-gray-400'}`}>
        {won ? 'しょうり！' : 'ざんねん...'}
      </h1>

      {/* ひらがなスコア */}
      {quizScore.total > 0 && (
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-400">ひらがなクイズ</div>
          <div className="text-lg font-bold text-cyan-400">
            {quizScore.correct}/{quizScore.total} せいかい
            {quizScore.total > 0 && (
              <span className="text-sm ml-1">
                ({Math.round((quizScore.correct / quizScore.total) * 100)}%)
              </span>
            )}
          </div>
        </div>
      )}

      {won && (
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-sm text-gray-400">ごほうび</div>
          <div className="text-xl font-bold text-yellow-400">🎫 ×3 ガチャチケット</div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => {
            setPhase('select');
            setSelectedIds([]);
            setBattleOver(false);
            setLogs([]);
          }}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-lg active:scale-95 transition-all"
        >
          もういちど バトル
        </button>
        <Link href="/" className="block">
          <button className="w-full py-3 rounded-xl bg-gray-700 font-bold active:scale-95 transition-all">
            タイトルへ
          </button>
        </Link>
        {won && (
          <Link href="/gacha" className="block">
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 font-bold active:scale-95 transition-all">
              🎰 ガチャをひく
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
