export interface NumberQuestion {
  number: number;
  emoji: string;
  count: string; // 表示用の絵文字の並び
  word: string;
}

export const NUMBERS: NumberQuestion[] = [
  { number: 1, emoji: '🍎', count: '🍎', word: 'いち' },
  { number: 2, emoji: '🍌', count: '🍌🍌', word: 'に' },
  { number: 3, emoji: '🍊', count: '🍊🍊🍊', word: 'さん' },
  { number: 4, emoji: '🍇', count: '🍇🍇🍇🍇', word: 'よん' },
  { number: 5, emoji: '🍓', count: '🍓🍓🍓🍓🍓', word: 'ご' },
  { number: 6, emoji: '🐟', count: '🐟🐟🐟🐟🐟🐟', word: 'ろく' },
  { number: 7, emoji: '⭐', count: '⭐⭐⭐⭐⭐⭐⭐', word: 'なな' },
  { number: 8, emoji: '🌸', count: '🌸🌸🌸🌸🌸🌸🌸🌸', word: 'はち' },
  { number: 9, emoji: '🎈', count: '🎈🎈🎈🎈🎈🎈🎈🎈🎈', word: 'きゅう' },
  { number: 10, emoji: '🐣', count: '🐣🐣🐣🐣🐣🐣🐣🐣🐣🐣', word: 'じゅう' },
];

export type NumberMode = 'count' | 'read' | 'order';

export interface NumberQuiz {
  mode: NumberMode;
  question: NumberQuestion;
  displayText: string;
  choices: number[];
  correctIndex: number;
}

// いくつあるかな？（絵文字を数える）
function generateCountQuiz(): NumberQuiz {
  const q = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const choices = [q.number];
  while (choices.length < 4) {
    const r = Math.floor(Math.random() * 10) + 1;
    if (!choices.includes(r)) choices.push(r);
  }
  const shuffled = [...choices].sort(() => Math.random() - 0.5);
  return {
    mode: 'count',
    question: q,
    displayText: q.count,
    choices: shuffled,
    correctIndex: shuffled.indexOf(q.number),
  };
}

// この すうじ は なに？（数字を読む）
function generateReadQuiz(): NumberQuiz {
  const q = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const choices = [q.number];
  while (choices.length < 4) {
    const r = Math.floor(Math.random() * 10) + 1;
    if (!choices.includes(r)) choices.push(r);
  }
  const shuffled = [...choices].sort(() => Math.random() - 0.5);
  return {
    mode: 'read',
    question: q,
    displayText: String(q.number),
    choices: shuffled,
    correctIndex: shuffled.indexOf(q.number),
  };
}

// どっちが おおきい？（2つの数を比較）
function generateOrderQuiz(): NumberQuiz {
  const a = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  let b: NumberQuestion;
  do {
    b = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  } while (b.number === a.number);

  const bigger = a.number > b.number ? a : b;
  const choices = [a.number, b.number];
  return {
    mode: 'order',
    question: bigger,
    displayText: `${a.number} と ${b.number}`,
    choices,
    correctIndex: choices.indexOf(bigger.number),
  };
}

export function generateNumberQuiz(): NumberQuiz {
  const modes: NumberMode[] = ['count', 'count', 'read', 'order'];
  const mode = modes[Math.floor(Math.random() * modes.length)];
  switch (mode) {
    case 'count': return generateCountQuiz();
    case 'read': return generateReadQuiz();
    case 'order': return generateOrderQuiz();
  }
}
