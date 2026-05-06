export interface HiraganaChar {
  char: string;
  word: string;
  emoji: string;
}

export const HIRAGANA: HiraganaChar[] = [
  { char: 'あ', word: 'あひる', emoji: '🦆' },
  { char: 'い', word: 'いちご', emoji: '🍓' },
  { char: 'う', word: 'うさぎ', emoji: '🐰' },
  { char: 'え', word: 'えんぴつ', emoji: '✏️' },
  { char: 'お', word: 'おに', emoji: '👹' },
  { char: 'か', word: 'かめ', emoji: '🐢' },
  { char: 'き', word: 'きりん', emoji: '🦒' },
  { char: 'く', word: 'くま', emoji: '🐻' },
  { char: 'け', word: 'けーき', emoji: '🎂' },
  { char: 'こ', word: 'こあら', emoji: '🐨' },
  { char: 'さ', word: 'さかな', emoji: '🐟' },
  { char: 'し', word: 'しまうま', emoji: '🦓' },
  { char: 'す', word: 'すいか', emoji: '🍉' },
  { char: 'せ', word: 'せみ', emoji: '🦟' },
  { char: 'そ', word: 'そら', emoji: '🌤️' },
  { char: 'た', word: 'たこ', emoji: '🐙' },
  { char: 'ち', word: 'ちょうちょ', emoji: '🦋' },
  { char: 'つ', word: 'つき', emoji: '🌙' },
  { char: 'て', word: 'てぶくろ', emoji: '🧤' },
  { char: 'と', word: 'とり', emoji: '🐦' },
  { char: 'な', word: 'なし', emoji: '🍐' },
  { char: 'に', word: 'にじ', emoji: '🌈' },
  { char: 'ぬ', word: 'ぬいぐるみ', emoji: '🧸' },
  { char: 'ね', word: 'ねこ', emoji: '🐱' },
  { char: 'の', word: 'のりもの', emoji: '🚗' },
  { char: 'は', word: 'はな', emoji: '🌸' },
  { char: 'ひ', word: 'ひよこ', emoji: '🐥' },
  { char: 'ふ', word: 'ふね', emoji: '⛵' },
  { char: 'へ', word: 'へび', emoji: '🐍' },
  { char: 'ほ', word: 'ほし', emoji: '⭐' },
  { char: 'ま', word: 'まほう', emoji: '🔮' },
  { char: 'み', word: 'みかん', emoji: '🍊' },
  { char: 'む', word: 'むし', emoji: '🐛' },
  { char: 'め', word: 'めがね', emoji: '👓' },
  { char: 'も', word: 'もも', emoji: '🍑' },
  { char: 'や', word: 'やぎ', emoji: '🐐' },
  { char: 'ゆ', word: 'ゆき', emoji: '❄️' },
  { char: 'よ', word: 'よつば', emoji: '🍀' },
  { char: 'ら', word: 'らいおん', emoji: '🦁' },
  { char: 'り', word: 'りんご', emoji: '🍎' },
  { char: 'る', word: 'るびー', emoji: '💎' },
  { char: 'れ', word: 'れもん', emoji: '🍋' },
  { char: 'ろ', word: 'ろけっと', emoji: '🚀' },
  { char: 'わ', word: 'わに', emoji: '🐊' },
];

export interface HiraganaQuiz {
  question: HiraganaChar;
  choices: string[];
  correctIndex: number;
}

export function generateQuiz(): HiraganaQuiz {
  const pool = HIRAGANA;
  const questionIdx = Math.floor(Math.random() * pool.length);
  const question = pool[questionIdx];

  // 正解を含む4択を作る
  const choices = [question.char];
  while (choices.length < 4) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    if (!choices.includes(r.char)) {
      choices.push(r.char);
    }
  }

  // シャッフル
  const shuffled = [...choices].sort(() => Math.random() - 0.5);
  const correctIndex = shuffled.indexOf(question.char);

  return { question, choices: shuffled, correctIndex };
}
