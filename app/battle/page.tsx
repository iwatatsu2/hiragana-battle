'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import CardView from '@/components/CardView';
import { Card, BattleMonster, Difficulty, BattleLog } from '@/lib/types';
import { CARDS, ATTR_NAMES, getCardById } from '@/lib/cards';
import { createBattleMonster, calcDamage, generateCpuTeam, cpuChooseAction, getTypeMultiplier } from '@/lib/battle';
import { loadData, recordWin, recordLoss } from '@/lib/storage';

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

    // SPD で先攻判定
    const playerFirst = pTeam[0].card.spd >= cTeam[0].card.spd;
    setIsPlayerTurn(playerFirst);
    setPhase('battle');

    addLog('バトルスタート！');
    if (!playerFirst) {
      // CPU先攻
      setTimeout(() => doCpuTurn(pTeam, cTeam, 0, 0, diff), 1000);
    }
  };

  const checkGameOver = useCallback((pTeam: BattleMonster[], cTeam: BattleMonster[]): 'player' | 'cpu' | null => {
    if (pTeam.every(m => m.currentHp <= 0)) return 'cpu';
    if (cTeam.every(m => m.currentHp <= 0)) return 'player';
    return null;
  }, []);

  const doAttack = (attacker: BattleMonster, defender: BattleMonster, isSkill: boolean, isPlayer: boolean) => {
    const { damage, multiplier } = calcDamage(attacker, defender, isSkill);
    defender.currentHp = Math.max(0, defender.currentHp - damage);

    const actionName = isSkill ? attacker.card.skill : 'こうげき';
    let msg = `${attacker.card.name}の ${actionName}！ ${damage}ダメージ！`;
    if (multiplier > 1) msg += ' こうかばつぐん！';
    if (multiplier < 1) msg += ' こうかいまひとつ...';

    addLog(msg, 'damage');

    if (isPlayer) {
      setShakeCpu(true);
      setDamagePopCpu(damage);
      setTimeout(() => { setShakeCpu(false); setDamagePopCpu(null); }, 500);
    } else {
      setShakePlayer(true);
      setDamagePopPlayer(damage);
      setTimeout(() => { setShakePlayer(false); setDamagePopPlayer(null); }, 500);
    }

    if (defender.currentHp <= 0) {
      addLog(`${defender.card.name}は たおれた！`, 'ko');
    }

    return damage;
  };

  const findNextAlive = (team: BattleMonster[], currentIdx: number): number => {
    for (let i = 0; i < team.length; i++) {
      if (i !== currentIdx && team[i].currentHp > 0) return i;
    }
    return -1;
  };

  const handlePlayerAction = (action: 'attack' | 'skill', switchIdx?: number) => {
    if (!isPlayerTurn || battleOver || processing) return;
    setProcessing(true);

    const pTeam = [...playerTeam];
    const cTeam = [...cpuTeam];
    let pIdx = playerActive;
    let cIdx = cpuActive;

    if (action === 'attack' || action === 'skill') {
      doAttack(pTeam[pIdx], cTeam[cIdx], action === 'skill', true);

      if (cTeam[cIdx].currentHp <= 0) {
        const next = findNextAlive(cTeam, cIdx);
        if (next === -1) {
          // プレイヤー勝利
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
    }

    setPlayerTeam([...pTeam]);
    setCpuTeam([...cTeam]);
    setIsPlayerTurn(false);

    // CPU turn
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
      cIdx = result.switchIndex;
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
      <div className="min-h-dvh p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-gray-400 text-sm">← もどる</Link>
          <h1 className="text-lg font-bold">チームをえらぼう（3たい）</h1>
          <div className="text-cyan-400 text-sm">{selectedIds.length}/3</div>
        </div>

        <div className="grid grid-cols-4 gap-2 flex-1 overflow-y-auto pb-20">
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
          <div className="text-center text-yellow-400 text-sm mb-2">
            カードが たりません。ガチャで ふやそう！
          </div>
        )}

        <button
          onClick={() => selectedIds.length === 3 && setPhase('difficulty')}
          disabled={selectedIds.length !== 3}
          className={`fixed bottom-4 left-4 right-4 py-4 rounded-xl font-bold text-lg transition-all ${
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
      <div className="min-h-dvh flex flex-col p-2 gap-2">
        {/* CPU側 */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {cpuTeam.map((m, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${m.currentHp > 0 ? 'bg-red-500' : 'bg-gray-700'}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400">あいてのチーム</span>
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
          <span className="text-xs text-gray-400">じぶんのチーム</span>
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
          {playerTeam.map((m, i) => (
            i !== playerActive && (
              <button
                key={i}
                onClick={() => handleSwitch(i)}
                disabled={!isPlayerTurn || m.currentHp <= 0 || processing}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  isPlayerTurn && m.currentHp > 0 && !processing
                    ? 'bg-gray-700 hover:bg-gray-600 active:scale-95'
                    : 'bg-gray-800 text-gray-600'
                }`}
              >
                🔄 {m.card.emoji} {m.card.name}
                <div className="text-[10px] text-gray-400">HP {m.currentHp}/{m.card.hp}</div>
              </button>
            )
          ))}
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
