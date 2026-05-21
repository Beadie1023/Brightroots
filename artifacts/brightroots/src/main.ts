/* BrightRoots Adventure - Main App */
import "./index.css";

// ── Types ──────────────────────────────────────────────────────────────────
interface Profile {
  id: number;
  name: string;
  ageGroup: "2-3" | "4-5" | "6-7";
  avatar?: string;
  coins: number;
  streak: number;
  progress: Record<string, number>;
  accuracy: Record<string, number>;
  createdAt: string;
}

interface Lesson {
  id: string;
  age: string;
  subject: string;
  level: number;
  story: string;
  question: string;
  options: string[];
  answer: string;
  reward: number;
}

// ── State ──────────────────────────────────────────────────────────────────
let currentProfile: Profile | null = null;
let currentSubject = "";
let currentLesson: Lesson | null = null;
let lessonQueue: Lesson[] = [];
let lessonIndex = 0;
let sessionCorrect = 0;
let sessionTotal = 0;
const LESSONS_PER_SESSION = 5;
const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

// ── Lesson Engine ──────────────────────────────────────────────────────────
const characters = ["monkey 🐒", "pirate 🏴‍☠️", "robot 🤖", "lion 🦁", "astronaut 🚀", "wizard 🧙", "princess 👸", "dino 🦕"];
const items = ["🍎", "🍌", "⭐", "⚽", "🎁", "🍭", "🚀", "💎", "🦋", "🌈"];
const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function buildLessons(): Lesson[] {
  const lessons: Lesson[] = [];
  let id = 0;

  function addLesson(age: string, subject: string, level: number, story: string, question: string, options: string[], answer: string, reward: number) {
    lessons.push({ id: String(++id), age, subject, level, story, question, options, answer, reward });
  }

  // ─── MATH ──────────────────────────────────────────────────────────────

  // Ages 2-3: Counting 1-5
  for (let n = 1; n <= 5; n++) {
    const char = pick(characters);
    const item = pick(items);
    addLesson("2-3", "math", 1,
      `Help the ${char} count the ${item}!`,
      `How many ${item} are there? ${item.repeat(n)}`,
      shuffle([String(n), String(n === 1 ? 2 : n - 1), String(n === 5 ? 3 : n + 1)]),
      String(n), 5);
  }

  // Ages 2-3: Number recognition
  for (let n = 1; n <= 5; n++) {
    addLesson("2-3", "math", 2,
      `The ${pick(characters)} needs to find the number!`,
      `Which number is ${n}?`,
      shuffle([String(n), String((n % 5) + 1), String(((n + 1) % 5) + 1)]),
      String(n), 5);
  }

  // Ages 4-5: Addition up to 10
  for (let a = 1; a <= 5; a++) {
    for (let b = 1; b <= 5; b++) {
      const ans = a + b;
      const char = pick(characters);
      const item = pick(items);
      addLesson("4-5", "math", Math.ceil(a / 2),
        `The ${char} found ${a} ${item} and then ${b} more ${item}.`,
        `How many ${item} altogether? ${a} + ${b} = ?`,
        shuffle([String(ans), String(ans + 1), String(ans - 1 < 0 ? ans + 2 : ans - 1)]),
        String(ans), 8);
    }
  }

  // Ages 4-5: Subtraction
  for (let a = 3; a <= 9; a++) {
    const b = randInt(1, a - 1);
    const ans = a - b;
    addLesson("4-5", "math", 4,
      `The ${pick(characters)} had ${a} ${pick(items)} but gave away ${b}.`,
      `How many are left? ${a} − ${b} = ?`,
      shuffle([String(ans), String(ans + 1), String(ans + 2)]),
      String(ans), 8);
  }

  // Ages 6-7: Addition up to 20
  for (let i = 0; i < 15; i++) {
    const a = randInt(5, 12); const b = randInt(3, 8);
    const ans = a + b;
    addLesson("6-7", "math", 6,
      `The ${pick(characters)} collected ${a} and ${b} more treasures!`,
      `What is ${a} + ${b}?`,
      shuffle([String(ans), String(ans + 2), String(ans - 2)]),
      String(ans), 10);
  }

  // Ages 6-7: Multiplication basics
  const mulPairs: [number, number][] = [[2,2],[2,3],[2,4],[2,5],[3,3],[3,4],[5,2],[5,3],[10,2]];
  for (const [a, b] of mulPairs) {
    addLesson("6-7", "math", 8,
      `The ${pick(characters)} made ${a} groups of ${b} ${pick(items)}.`,
      `${a} × ${b} = ?`,
      shuffle([String(a * b), String(a * b + 2), String(a * b - 2)]),
      String(a * b), 12);
  }

  // ─── READING ───────────────────────────────────────────────────────────

  // Ages 2-3: Letter recognition
  const letters2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  for (const letter of letters2.slice(0, 10)) {
    addLesson("2-3", "reading", 1,
      `Help ${pick(characters)} find the letter!`,
      `Which letter is this? ${letter}`,
      shuffle([letter, letters2[(letters2.indexOf(letter) + 1) % 26], letters2[(letters2.indexOf(letter) + 5) % 26]]),
      letter, 5);
  }

  // Ages 2-3: Letter sounds
  const phonics: [string, string][] = [["A", "Apple 🍎"], ["B", "Ball ⚽"], ["C", "Cat 🐱"], ["D", "Dog 🐶"], ["E", "Egg 🥚"], ["S", "Sun ☀️"], ["T", "Tree 🌳"], ["M", "Moon 🌙"]];
  for (const [letter, word] of phonics) {
    addLesson("2-3", "reading", 2,
      `The ${pick(characters)} loves the letter ${letter}!`,
      `${letter} is for _____`,
      shuffle([word, phonics.find(p => p[0] !== letter)?.[1] ?? "Ant 🐜", "Fish 🐟"]),
      word, 5);
  }

  // Ages 4-5: Sight words
  const sightWords = [["The", "cat sat on the mat.", "The"], ["A", "A big red ball.", "A"], ["Is", "The sky is blue.", "Is"], ["In", "A bird in a tree.", "In"], ["It", "It is a dog.", "It"], ["We", "We can run.", "We"], ["Go", "Go to school.", "Go"], ["See", "I see a bird.", "See"]];
  for (const [word, sentence, answer] of sightWords) {
    addLesson("4-5", "reading", 3,
      `${pick(characters)} is reading a sentence!`,
      `Find the word "${word}" in: "${sentence}"`,
      shuffle([answer, "Cat", "Run", "Blue"].slice(0, 3)),
      answer, 8);
  }

  // Ages 4-5: Phonics blends
  const blends: [string, string, string[]][] = [
    ["bl", "black", ["black", "back", "lack"]],
    ["tr", "tree", ["tree", "tee", "free"]],
    ["st", "star", ["star", "tar", "car"]],
    ["cl", "clap", ["clap", "cap", "lap"]],
    ["gr", "green", ["green", "seen", "been"]],
  ];
  for (const [blend, word, opts] of blends) {
    addLesson("4-5", "reading", 4,
      `The ${pick(characters)} is learning blends!`,
      `The blend "${blend}" makes the word:`,
      shuffle(opts), word, 8);
  }

  // Ages 6-7: Reading comprehension
  const passages: [string, string, string[]][] = [
    ["Tom has a red ball. He plays in the park.", "What color is Tom's ball?", ["Red", "Blue", "Green"]],
    ["The sun shines in the day. The moon shines at night.", "When does the moon shine?", ["At night", "In the day", "In the morning"]],
    ["Sara has a pet cat. The cat likes to sleep.", "What does Sara's cat like to do?", ["Sleep", "Run", "Swim"]],
    ["Birds have wings. They can fly high in the sky.", "What can birds do?", ["Fly", "Swim", "Bark"]],
    ["It rained all day. Jake wore his boots.", "Why did Jake wear boots?", ["It was raining", "It was sunny", "It was cold"]],
  ];
  for (const [passage, question, opts] of passages) {
    addLesson("6-7", "reading", 5,
      passage,
      question,
      shuffle(opts), opts[0], 10);
  }

  // ─── SPELLING ──────────────────────────────────────────────────────────

  // Ages 4-5: 3-letter words
  const words3: [string, string][] = [["cat", "c_t"], ["dog", "d_g"], ["sun", "s_n"], ["hat", "h_t"], ["run", "r_n"], ["cup", "c_p"], ["bed", "b_d"], ["fox", "f_x"]];
  for (const [word, blank] of words3) {
    const missing = word[1];
    const opts = shuffle([missing, ...getWrongLetters(missing, 2)]);
    addLesson("4-5", "spelling", 3,
      `Help the ${pick(characters)} complete the word!`,
      `Fill the blank: ${blank}`,
      opts, missing, 8);
  }

  // Ages 4-5: Choose the spelling
  const spellingOpts: [string, string[]][] = [
    ["cake", ["cake", "caek", "cakk"]],
    ["bike", ["bike", "biek", "biik"]],
    ["fish", ["fish", "fesh", "fich"]],
    ["jump", ["jump", "jupm", "jamp"]],
    ["play", ["play", "plae", "plya"]],
  ];
  for (const [word, opts] of spellingOpts) {
    addLesson("4-5", "spelling", 4,
      `The ${pick(characters)} is learning to spell!`,
      `Which spelling is correct?`,
      shuffle(opts), word, 8);
  }

  // Ages 6-7: Longer words
  const words6: [string, string[]][] = [
    ["happy", ["happy", "hapy", "hapie"]],
    ["friend", ["friend", "freind", "frend"]],
    ["beautiful", ["beautiful", "beutiful", "beautyful"]],
    ["because", ["because", "becaus", "beacuse"]],
    ["through", ["through", "throgh", "thru"]],
    ["different", ["different", "diferent", "diffrent"]],
    ["together", ["together", "togethr", "togther"]],
    ["always", ["always", "allways", "alwys"]],
  ];
  for (const [word, opts] of words6) {
    addLesson("6-7", "spelling", 6,
      `The ${pick(characters)} challenges you to spell!`,
      `Which spelling is correct?`,
      shuffle(opts), word, 10);
  }

  // ─── LOGIC ─────────────────────────────────────────────────────────────

  // Ages 2-3: Matching
  const matching: [string, string, string[]][] = [
    ["🐱", "meow", ["meow", "woof", "moo"]],
    ["🐶", "woof", ["woof", "meow", "roar"]],
    ["🐄", "moo", ["moo", "oink", "baa"]],
    ["🐷", "oink", ["oink", "cluck", "moo"]],
    ["🐔", "cluck", ["cluck", "roar", "woof"]],
    ["🦁", "roar", ["roar", "meow", "cluck"]],
  ];
  for (const [animal, sound, opts] of matching) {
    addLesson("2-3", "logic", 1,
      `What sound does this animal make?`,
      `${animal} says...`,
      shuffle(opts), sound, 5);
  }

  // Ages 2-3: Colors
  const colorLessons: [string, string][] = [["🍎", "red"], ["🍋", "yellow"], ["🍀", "green"], ["🔵", "blue"], ["🟣", "purple"], ["🟠", "orange"]];
  for (const [emoji, color] of colorLessons) {
    addLesson("2-3", "logic", 2,
      `Help ${pick(characters)} learn colors!`,
      `What color is ${emoji}?`,
      shuffle([color, ...colors.filter(c => c !== color).slice(0, 2)]),
      color, 5);
  }

  // Ages 4-5: Odd one out
  const oddOnes: [string, string[]][] = [
    ["🐶 is not a fruit", ["🍎 🍌 🐶 🍓", "🍎 🍌 🍇 🍓"]],
    ["⚽ is not an animal", ["🐱 🐶 ⚽ 🐸", "🐱 🐶 🐯 🐸"]],
    ["🚗 is not a fruit", ["🍊 🍇 🚗 🍉", "🍊 🍇 🍋 🍉"]],
  ];
  for (const [answer, opts] of oddOnes) {
    addLesson("4-5", "logic", 3,
      `Find the one that doesn't belong!`,
      `Which group has an odd one out?`,
      shuffle([opts[0], opts[1], "🍎 🍌 🍇 🍓"]),
      opts[0], 8);
  }

  // Ages 4-5: Pattern completion
  const patterns: [string, string, string[]][] = [
    ["🔴🔵🔴🔵🔴", "?", ["🔵", "🔴", "🟡"]],
    ["⭐🌙⭐🌙⭐", "?", ["🌙", "⭐", "☀️"]],
    ["🐱🐶🐱🐶🐱", "?", ["🐶", "🐱", "🐸"]],
    ["1 2 3 1 2 3 1", "?", ["2", "3", "4"]],
    ["🌹🌻🌹🌻🌹", "?", ["🌻", "🌹", "🌷"]],
  ];
  for (const [pattern, _q, opts] of patterns) {
    addLesson("4-5", "logic", 4,
      `${pick(characters)} loves patterns!`,
      `What comes next? ${pattern}`,
      shuffle(opts), opts[0], 8);
  }

  // Ages 6-7: Word patterns & comparisons
  const comparisons: [string, string, string[]][] = [
    ["Hot is to cold as day is to ___", "night", ["night", "sun", "cloud"]],
    ["Puppy is to dog as kitten is to ___", "cat", ["cat", "bird", "fish"]],
    ["Big is to small as fast is to ___", "slow", ["slow", "large", "quick"]],
    ["Bird is to fly as fish is to ___", "swim", ["swim", "run", "jump"]],
    ["2 is to 4 as 3 is to ___", "6", ["6", "5", "7"]],
    ["Apple is to fruit as rose is to ___", "flower", ["flower", "leaf", "tree"]],
  ];
  for (const [q, answer, opts] of comparisons) {
    addLesson("6-7", "logic", 7,
      `${pick(characters)} loves brain teasers!`,
      q,
      shuffle(opts), answer, 10);
  }

  // ─── GRAMMAR ───────────────────────────────────────────────────────────

  // Ages 4-5: Nouns
  const nouns: [string, string[]][] = [
    ["Which word is a noun (person, place, or thing)?", ["dog", "run", "happy"]],
    ["Which word is a noun?", ["apple", "jump", "fast"]],
    ["Which word is a noun?", ["school", "sing", "blue"]],
    ["Which word is a noun?", ["bird", "fly", "quick"]],
    ["Which word names a person?", ["teacher", "sleep", "tall"]],
  ];
  for (const [question, opts] of nouns) {
    addLesson("4-5", "grammar", 3,
      `${pick(characters)} is learning grammar!`,
      question,
      shuffle(opts), opts[0], 8);
  }

  // Ages 4-5: Verbs
  const verbs: [string, string[]][] = [
    ["Which word is a verb (action)?", ["run", "cat", "big"]],
    ["Which word shows an action?", ["jump", "tree", "happy"]],
    ["Which word is a verb?", ["sing", "apple", "tall"]],
    ["Which word describes what you do?", ["eat", "house", "pretty"]],
  ];
  for (const [question, opts] of verbs) {
    addLesson("4-5", "grammar", 4,
      `The ${pick(characters)} is learning verbs!`,
      question,
      shuffle(opts), opts[0], 8);
  }

  // Ages 6-7: Sentence completion
  const sentences: [string, string, string[]][] = [
    ["The dog ___ in the park.", "plays", ["plays", "play", "playing"]],
    ["She ___ a beautiful song.", "sings", ["sings", "sing", "sang"]],
    ["They ___ to school every day.", "go", ["go", "goes", "going"]],
    ["He ___ his homework last night.", "did", ["did", "does", "do"]],
    ["The birds ___ south for winter.", "fly", ["fly", "flies", "flied"]],
    ["I ___ very happy today.", "am", ["am", "is", "are"]],
  ];
  for (const [sentence, answer, opts] of sentences) {
    addLesson("6-7", "grammar", 5,
      `${pick(characters)} needs help with the sentence!`,
      `Choose the correct word: "${sentence}"`,
      shuffle(opts), answer, 10);
  }

  // Ages 6-7: Punctuation
  const punctuation: [string, string, string[]][] = [
    ["Which sentence uses correct punctuation?", "The cat sat on the mat.", ["The cat sat on the mat.", "the cat sat on the mat", "The cat sat on the mat!?"]],
    ["A question should end with:", "?", ["?", ".", "!"]],
    ["An exclamation should end with:", "!", ["!", ".", "?"]],
    ["Which is a complete sentence?", "The bird flew away.", ["The bird flew away.", "bird flew", "the bird"]],
  ];
  for (const [question, answer, opts] of punctuation) {
    addLesson("6-7", "grammar", 6,
      `The ${pick(characters)} is mastering punctuation!`,
      question,
      shuffle(opts), answer, 10);
  }

  // ─── MONEY ─────────────────────────────────────────────────────────────

  // Ages 4-5: Coin recognition
  const coins: [string, string, string[]][] = [
    ["A penny is worth ___", "1 cent", ["1 cent", "5 cents", "10 cents"]],
    ["A nickel is worth ___", "5 cents", ["5 cents", "1 cent", "10 cents"]],
    ["A dime is worth ___", "10 cents", ["10 cents", "5 cents", "25 cents"]],
    ["A quarter is worth ___", "25 cents", ["25 cents", "10 cents", "50 cents"]],
    ["Which coin is worth the most?", "Quarter", ["Quarter", "Penny", "Nickel"]],
  ];
  for (const [question, answer, opts] of coins) {
    addLesson("4-5", "money", 3,
      `Welcome to Money Town! ${pick(characters)} needs help with coins!`,
      question,
      shuffle(opts), answer, 8);
  }

  // Ages 4-5: Counting coins
  const coinCount: [string, string, string[]][] = [
    ["5 pennies = ___", "5 cents", ["5 cents", "10 cents", "1 cent"]],
    ["2 nickels = ___", "10 cents", ["10 cents", "5 cents", "15 cents"]],
    ["2 dimes = ___", "20 cents", ["20 cents", "10 cents", "30 cents"]],
    ["4 quarters = ___", "$1.00", ["$1.00", "50 cents", "75 cents"]],
  ];
  for (const [question, answer, opts] of coinCount) {
    addLesson("4-5", "money", 4,
      `Count the coins with ${pick(characters)}!`,
      question,
      shuffle(opts), answer, 8);
  }

  // Ages 6-7: Earning & saving
  const moneyEarn: [string, string, string[]][] = [
    ["If you earn $5 and save $2, how much do you spend?", "$3", ["$3", "$2", "$7"]],
    ["You have $10. You buy a toy for $6. How much is left?", "$4", ["$4", "$6", "$3"]],
    ["You save $1 every day for 5 days. How much do you have?", "$5", ["$5", "$6", "$4"]],
    ["A book costs $8. You have $5. How much more do you need?", "$3", ["$3", "$2", "$4"]],
    ["You earn $3 for chores. You spend $1. How much saved?", "$2", ["$2", "$3", "$1"]],
  ];
  for (const [question, answer, opts] of moneyEarn) {
    addLesson("6-7", "money", 6,
      `${pick(characters)} is learning to manage money!`,
      question,
      shuffle(opts), answer, 10);
  }

  // Ages 6-7: Budget choices
  const budget: [string, string, string[]][] = [
    ["You have $5. A toy costs $8. Can you buy it?", "No", ["No", "Yes", "Maybe"]],
    ["Which is better: spend all coins or save some?", "Save some", ["Save some", "Spend all", "Give all away"]],
    ["If something costs $3 and you have $5, you get ___ change.", "$2", ["$2", "$3", "$1"]],
    ["A need is something you ___ and a want is something you ___.", "must have / like to have", ["must have / like to have", "like to have / must have", "buy / sell"]],
  ];
  for (const [question, answer, opts] of budget) {
    addLesson("6-7", "money", 7,
      `Money Town Budget Challenge with ${pick(characters)}!`,
      question,
      shuffle(opts), answer, 10);
  }

  return lessons;
}

function getWrongLetters(correct: string, count: number): string[] {
  const vowels = "aeiou";
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const pool = vowels.includes(correct) ? vowels : consonants;
  const result: string[] = [];
  for (const l of pool) {
    if (l !== correct && result.length < count) result.push(l);
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_LESSONS = buildLessons();

// ── Adaptive Learning ───────────────────────────────────────────────────────
function getDifficulty(profile: Profile, subject: string): "easy" | "medium" | "hard" {
  const acc = (profile.accuracy[subject] ?? 0.5);
  if (acc >= 0.75) return "hard";
  if (acc >= 0.4) return "medium";
  return "easy";
}

function getLevelRange(difficulty: "easy" | "medium" | "hard"): [number, number] {
  if (difficulty === "easy") return [1, 3];
  if (difficulty === "medium") return [3, 6];
  return [6, 10];
}

function pickLessons(profile: Profile, subject: string, count: number): Lesson[] {
  const age = profile.ageGroup;
  const diff = getDifficulty(profile, subject);
  const [minL, maxL] = getLevelRange(diff);
  const candidates = ALL_LESSONS.filter(
    l => l.subject === subject && l.age === age && l.level >= minL && l.level <= maxL
  );
  if (candidates.length === 0) {
    return ALL_LESSONS.filter(l => l.subject === subject).slice(0, count);
  }
  return shuffle(candidates).slice(0, count);
}

// ── Voice ───────────────────────────────────────────────────────────────────
function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.85;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
}

function autoSpeak(profile: Profile, text: string) {
  if (profile.ageGroup === "2-3" || profile.ageGroup === "4-5") {
    speak(text);
  }
}

// ── API ─────────────────────────────────────────────────────────────────────
const API = `${BASE_PATH}/api`;

async function apiGetProfiles(): Promise<Profile[]> {
  try {
    const res = await fetch(`${API}/profiles`);
    const data = await res.json();
    return data.map(attachAvatar);
  } catch { return getLocalProfiles(); }
}

async function apiCreateProfile(name: string, ageGroup: string, avatar: string): Promise<Profile | null> {
  try {
    const res = await fetch(`${API}/profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ageGroup }),
    });
    const data = await res.json();
    const profile: Profile = { ...attachAvatar(data), avatar };
    saveLocalProfile(profile);
    return profile;
  } catch {
    const profile: Profile = {
      id: Date.now(), name, ageGroup: ageGroup as Profile["ageGroup"], avatar,
      coins: 0, streak: 0, progress: {}, accuracy: {}, createdAt: new Date().toISOString(),
    };
    saveLocalProfile(profile);
    return profile;
  }
}

async function apiUpdateProgress(profileId: number, subject: string, correct: boolean, coins: number) {
  const ls = getLocalProfiles();
  const idx = ls.findIndex(p => p.id === profileId);
  if (idx !== -1) {
    const p = ls[idx];
    p.coins += coins;
    const prevTotal = p.progress[subject] || 0;
    const prevAcc = p.accuracy[subject] || 0;
    p.progress[subject] = prevTotal + 1;
    p.accuracy[subject] = (prevAcc * prevTotal + (correct ? 1 : 0)) / (prevTotal + 1);
    ls[idx] = p;
    localStorage.setItem("br_profiles", JSON.stringify(ls));
    if (currentProfile?.id === profileId) currentProfile = p;
  }
  try {
    await fetch(`${API}/profiles/${profileId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, correct, coins }),
    });
  } catch { /* offline — local already saved */ }
}

async function apiDeleteProfile(id: number) {
  const ls = getLocalProfiles().filter(p => p.id !== id);
  localStorage.setItem("br_profiles", JSON.stringify(ls));
  try { await fetch(`${API}/profiles/${id}`, { method: "DELETE" }); } catch { /* offline */ }
}

// ── Local Storage ────────────────────────────────────────────────────────────
function getLocalProfiles(): Profile[] {
  try { return JSON.parse(localStorage.getItem("br_profiles") || "[]"); } catch { return []; }
}
function saveLocalProfile(profile: Profile) {
  const ls = getLocalProfiles();
  const idx = ls.findIndex(p => p.id === profile.id);
  if (idx === -1) ls.push(profile); else ls[idx] = profile;
  localStorage.setItem("br_profiles", JSON.stringify(ls));
}
function attachAvatar(p: Profile): Profile {
  const ls = getLocalProfiles();
  const local = ls.find(l => l.id === p.id);
  return { ...p, avatar: local?.avatar ?? p.avatar ?? "🐻" };
}

// ── Screen Management ─────────────────────────────────────────────────────────
function showScreen(id: string) {
  document.querySelectorAll<HTMLElement>(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) { el.classList.add("active"); el.scrollTop = 0; }
}

// ── WELCOME ───────────────────────────────────────────────────────────────────
document.getElementById("btn-start")?.addEventListener("click", () => {
  showScreen("screen-profiles");
  loadProfiles();
});

// ── PROFILES ─────────────────────────────────────────────────────────────────
async function loadProfiles() {
  const list = document.getElementById("profile-list")!;
  list.innerHTML = `<div class="profile-empty">Loading...</div>`;
  const profiles = await apiGetProfiles();
  renderProfileList(profiles);
}

function renderProfileList(profiles: Profile[]) {
  const list = document.getElementById("profile-list")!;
  if (profiles.length === 0) {
    list.innerHTML = `<div class="profile-empty">No profiles yet!<br/>Tap <strong>New</strong> to add a learner.</div>`;
    return;
  }
  list.innerHTML = profiles.map(p => `
    <div class="profile-card" data-id="${p.id}">
      <button class="del-btn" data-id="${p.id}" title="Delete">✕</button>
      <span class="card-avatar">${p.avatar ?? "🐻"}</span>
      <div class="card-name">${escHtml(p.name)}</div>
      <div class="card-age">Ages ${p.ageGroup}</div>
      <div class="card-coins">🪙 ${p.coins}</div>
    </div>
  `).join("");

  list.querySelectorAll<HTMLElement>(".profile-card").forEach(card => {
    card.addEventListener("click", e => {
      if ((e.target as HTMLElement).classList.contains("del-btn")) return;
      const id = parseInt(card.dataset.id!);
      const profile = profiles.find(p => p.id === id);
      if (profile) selectProfile(profile);
    });
  });
  list.querySelectorAll<HTMLButtonElement>(".del-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id!);
      if (confirm("Delete this profile?")) {
        await apiDeleteProfile(id);
        loadProfiles();
      }
    });
  });
}

document.getElementById("btn-add-profile")?.addEventListener("click", () => showScreen("screen-create-profile"));
document.getElementById("btn-parent-mode")?.addEventListener("click", () => { showParentDash(null); });

// ── CREATE PROFILE ────────────────────────────────────────────────────────────
let selectedAvatar = "🐻";
let selectedAge = "";

document.getElementById("avatar-picker")?.querySelectorAll<HTMLElement>(".avatar-opt").forEach(opt => {
  opt.addEventListener("click", () => {
    document.querySelectorAll(".avatar-opt").forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    selectedAvatar = opt.dataset.avatar!;
  });
});

document.getElementById("age-picker")?.querySelectorAll<HTMLElement>(".age-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".age-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedAge = btn.dataset.age!;
  });
});

document.getElementById("btn-back-to-profiles")?.addEventListener("click", () => {
  showScreen("screen-profiles");
  loadProfiles();
});

document.getElementById("btn-create-profile")?.addEventListener("click", async () => {
  const nameInput = document.getElementById("input-name") as HTMLInputElement;
  const errorDiv = document.getElementById("create-error")!;
  const name = nameInput.value.trim();
  if (!name) { errorDiv.textContent = "Please enter a name!"; return; }
  if (!selectedAge) { errorDiv.textContent = "Please pick an age group!"; return; }
  errorDiv.textContent = "";
  const profile = await apiCreateProfile(name, selectedAge, selectedAvatar);
  if (profile) {
    nameInput.value = "";
    selectedAge = "";
    document.querySelectorAll(".age-btn").forEach(b => b.classList.remove("active"));
    selectProfile(profile);
  }
});

// ── SELECT PROFILE ────────────────────────────────────────────────────────────
function selectProfile(profile: Profile) {
  currentProfile = profile;
  updateDashboard();
  showScreen("screen-dashboard");
  speak(`Hello ${profile.name}! Let's learn today!`);
}

function updateDashboard() {
  if (!currentProfile) return;
  const p = currentProfile;
  document.getElementById("dash-avatar")!.textContent = p.avatar ?? "🐻";
  document.getElementById("dash-name")!.textContent = p.name;
  document.getElementById("dash-coins")!.textContent = String(p.coins);
  document.getElementById("dash-streak")!.textContent = String(p.streak);
  const total = Object.values(p.progress).reduce((s, v) => s + v, 0);
  const pct = Math.min(100, (total % 20) * 5);
  const bar = document.getElementById("dash-progress-bar") as HTMLElement;
  bar.style.width = pct + "%";
}

document.getElementById("btn-switch-profile")?.addEventListener("click", () => {
  currentProfile = null;
  showScreen("screen-profiles");
  loadProfiles();
});

// ── DASHBOARD SUBJECTS ────────────────────────────────────────────────────────
document.querySelectorAll<HTMLElement>(".subject-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!currentProfile) return;
    currentSubject = btn.dataset.subject!;
    startSubject(currentSubject);
  });
});

function subjectLabel(subject: string): string {
  const map: Record<string, string> = {
    math: "🌴 Math", reading: "📚 Reading", logic: "🧠 Logic",
    money: "🏦 Money", grammar: "✍️ Grammar", spelling: "🔤 Spelling",
  };
  return map[subject] ?? subject;
}

function startSubject(subject: string) {
  if (!currentProfile) return;
  lessonQueue = pickLessons(currentProfile, subject, LESSONS_PER_SESSION);
  if (lessonQueue.length === 0) {
    alert("No lessons available for this age group yet. Keep growing!");
    return;
  }
  lessonIndex = 0;
  sessionCorrect = 0;
  sessionTotal = 0;
  document.getElementById("lesson-subject-label")!.textContent = subjectLabel(subject);
  loadLesson();
  showScreen("screen-lesson");
}

document.getElementById("btn-back-to-dash")?.addEventListener("click", () => {
  window.speechSynthesis?.cancel();
  if (currentProfile) { updateDashboard(); showScreen("screen-dashboard"); }
});

// ── LESSON ─────────────────────────────────────────────────────────────────────
function loadLesson() {
  if (!currentProfile || lessonIndex >= lessonQueue.length) {
    finishSession();
    return;
  }
  currentLesson = lessonQueue[lessonIndex];
  const story = document.getElementById("lesson-story")!;
  const question = document.getElementById("lesson-question")!;
  const optGrid = document.getElementById("lesson-options")!;
  const reward = document.getElementById("lesson-reward")!;

  story.textContent = currentLesson.story;
  question.textContent = currentLesson.question;
  reward.textContent = String(currentLesson.reward);

  optGrid.innerHTML = currentLesson.options.map(opt =>
    `<button class="option-btn">${escHtml(opt)}</button>`
  ).join("");

  optGrid.querySelectorAll<HTMLButtonElement>(".option-btn").forEach(btn => {
    btn.addEventListener("click", () => handleAnswer(btn));
  });

  renderDots();
  autoSpeak(currentProfile, currentLesson.question);
}

function renderDots() {
  const dots = document.getElementById("lesson-dots")!;
  dots.innerHTML = lessonQueue.map((_, i) =>
    `<div class="dot ${i < lessonIndex ? "done" : i === lessonIndex ? "active" : ""}"></div>`
  ).join("");
}

function handleAnswer(btn: HTMLButtonElement) {
  if (!currentLesson || !currentProfile) return;
  const isCorrect = btn.textContent?.trim() === currentLesson.answer.trim();
  const opts = document.querySelectorAll<HTMLButtonElement>(".option-btn");
  opts.forEach(b => {
    b.disabled = true;
    if (b.textContent?.trim() === currentLesson!.answer.trim()) b.classList.add("correct");
  });
  if (!isCorrect) btn.classList.add("wrong");

  sessionTotal++;
  if (isCorrect) sessionCorrect++;

  const reward = isCorrect ? currentLesson.reward : 0;

  apiUpdateProgress(currentProfile.id, currentSubject, isCorrect, reward);

  setTimeout(() => {
    if (isCorrect) {
      showReward(reward, currentLesson!.question);
    } else {
      showWrong(currentLesson!.answer);
    }
  }, 600);
}

document.getElementById("btn-speak")?.addEventListener("click", () => {
  if (currentLesson) speak(`${currentLesson.story} ${currentLesson.question}`);
});

// ── REWARD ─────────────────────────────────────────────────────────────────────
const rewardEmojis = ["⭐", "🏆", "🎉", "🌟", "✨", "🎊", "🥇", "💫"];
const rewardTitles = ["Amazing!", "Fantastic!", "You Rock!", "Brilliant!", "Super!", "Excellent!", "Awesome!"];

function showReward(coins: number, question: string) {
  const emoji = pick(rewardEmojis);
  const title = pick(rewardTitles);
  document.getElementById("reward-emoji")!.textContent = emoji;
  document.getElementById("reward-title")!.textContent = title;
  document.getElementById("reward-msg")!.textContent = "You got it right!";
  document.getElementById("reward-coins")!.textContent = String(coins);
  showScreen("screen-reward");
  speak(title);
  launchConfetti();
}

document.getElementById("btn-next-lesson")?.addEventListener("click", () => {
  lessonIndex++;
  loadLesson();
  showScreen("screen-lesson");
});

document.getElementById("btn-reward-home")?.addEventListener("click", () => {
  if (currentProfile) { updateDashboard(); showScreen("screen-dashboard"); }
});

// ── WRONG ──────────────────────────────────────────────────────────────────────
function showWrong(correctAnswer: string) {
  document.getElementById("correct-answer-box")!.textContent = correctAnswer;
  showScreen("screen-wrong");
  speak("Not quite! The correct answer is " + correctAnswer);
}

document.getElementById("btn-try-next")?.addEventListener("click", () => {
  lessonIndex++;
  if (lessonIndex >= lessonQueue.length) {
    finishSession();
  } else {
    loadLesson();
    showScreen("screen-lesson");
  }
});

// ── FINISH SESSION ──────────────────────────────────────────────────────────────
function finishSession() {
  if (currentProfile) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    const totalCoins = lessonQueue.reduce((s, l) => s + l.reward, 0);
    document.getElementById("reward-emoji")!.textContent = accuracy >= 60 ? "🏆" : "💪";
    document.getElementById("reward-title")!.textContent = `Session Complete!`;
    document.getElementById("reward-msg")!.textContent = `You got ${sessionCorrect}/${sessionTotal} correct! (${accuracy}%)`;
    document.getElementById("reward-coins")!.textContent = String(lessonQueue.reduce((s, _) => s + sessionCorrect > 0 ? 5 : 0, 0));
    showScreen("screen-reward");
    if (accuracy >= 60) { speak("Great job! Session complete!"); launchConfetti(); }
    else speak("Session complete! Keep practicing!");
  }
}

// ── PARENT DASHBOARD ───────────────────────────────────────────────────────────
async function showParentDash(profile: Profile | null) {
  showScreen("screen-parent");
  const content = document.getElementById("parent-content")!;
  let profiles: Profile[];
  if (profile) {
    profiles = [profile];
  } else {
    profiles = await apiGetProfiles();
  }

  if (profiles.length === 0) {
    content.innerHTML = `<div class="parent-card"><p>No profiles yet.</p></div>`;
    return;
  }

  content.innerHTML = profiles.map(p => {
    const subjects = ["math", "reading", "logic", "money", "grammar", "spelling"];
    const bars = subjects.map(s => {
      const acc = p.accuracy[s] ?? 0;
      const total = p.progress[s] ?? 0;
      return `<div class="subject-bar-row">
        <div class="sbr-label">
          <span>${subjectLabel(s)}</span>
          <span>${total} lessons · ${Math.round(acc * 100)}%</span>
        </div>
        <div class="sbr-bar"><div class="sbr-fill" style="width:${Math.round(acc * 100)}%"></div></div>
      </div>`;
    }).join("");

    const totalLessons = Object.values(p.progress).reduce((s, v) => s + v, 0);
    const accs = Object.entries(p.accuracy);
    const strongest = accs.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const weakest = accs.sort((a, b) => a[1] - b[1])[0]?.[0] ?? "—";

    return `<div class="parent-card">
      <h3>${p.avatar ?? "🐻"} ${escHtml(p.name)} — Age ${p.ageGroup}</h3>
      <div class="stat-row"><span class="label">Total Lessons</span><span class="val">${totalLessons}</span></div>
      <div class="stat-row"><span class="label">Total Coins</span><span class="val">🪙 ${p.coins}</span></div>
      <div class="stat-row"><span class="label">Streak</span><span class="val">🔥 ${p.streak}</span></div>
      <div class="stat-row"><span class="label">Strongest Subject</span><span class="val">${subjectLabel(strongest)}</span></div>
      <div class="stat-row"><span class="label">Weakest Subject</span><span class="val">${subjectLabel(weakest)}</span></div>
      <hr style="margin:12px 0;border-color:#f3f4f6"/>
      ${bars}
      <button class="btn btn-ghost btn-sm reset-btn" style="margin-top:12px;width:100%" data-reset="${p.id}">🔄 Reset Progress</button>
    </div>`;
  }).join("");

  content.querySelectorAll<HTMLButtonElement>(".reset-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.reset!);
      if (confirm("Reset all progress for this learner?")) {
        const ls = getLocalProfiles();
        const idx = ls.findIndex(p => p.id === id);
        if (idx !== -1) {
          ls[idx].coins = 0;
          ls[idx].streak = 0;
          ls[idx].progress = {};
          ls[idx].accuracy = {};
          localStorage.setItem("br_profiles", JSON.stringify(ls));
          if (currentProfile?.id === id) currentProfile = ls[idx];
        }
        showParentDash(null);
      }
    });
  });
}

document.getElementById("btn-back-from-parent")?.addEventListener("click", () => {
  if (currentProfile) { updateDashboard(); showScreen("screen-dashboard"); }
  else showScreen("screen-profiles");
});

// ── CONFETTI ───────────────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d")!;
  const colors = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    r: Math.random() * 8 + 4,
    color: pick(colors),
    vx: (Math.random() - .5) * 4,
    vy: Math.random() * 3 + 2,
    alpha: 1,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.008;
    }
    ctx.globalAlpha = 1;
    frame++;
    if (frame < 120) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ── UTILS ──────────────────────────────────────────────────────────────────────
function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Init
showScreen("screen-welcome");
