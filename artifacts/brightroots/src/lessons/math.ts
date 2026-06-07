import type { LessonDef } from "./types";
import { pick, randInt, shuffle, CHARACTERS, ITEMS } from "./types";

export function buildMathLessons(): LessonDef[] {
  const lessons: LessonDef[] = [];

  // Ages 2-3: Counting 1-5
  for (let n = 1; n <= 5; n++) {
    const char = pick(CHARACTERS);
    const item = pick(ITEMS);
    lessons.push({
      age: "2-3", subject: "math", level: 1, reward: 5,
      story: `Help the ${char} count the ${item}!`,
      question: `How many ${item} are there? ${item.repeat(n)}`,
      options: shuffle([String(n), String(n === 1 ? 2 : n - 1), String(n === 5 ? 3 : n + 1)]),
      answer: String(n),
    });
  }

  // Ages 2-3: Number recognition
  for (let n = 1; n <= 5; n++) {
    lessons.push({
      age: "2-3", subject: "math", level: 2, reward: 5,
      story: `The ${pick(CHARACTERS)} needs to find the number!`,
      question: `Which number is ${n}?`,
      options: shuffle([String(n), String((n % 5) + 1), String(((n + 1) % 5) + 1)]),
      answer: String(n),
    });
  }

  // Ages 4-5: Addition up to 10
  for (let a = 1; a <= 5; a++) {
    for (let b = 1; b <= 5; b++) {
      const ans = a + b;
      lessons.push({
        age: "4-5", subject: "math", level: Math.ceil(a / 2), reward: 8,
        story: `The ${pick(CHARACTERS)} found ${a} ${pick(ITEMS)} and then ${b} more.`,
        question: `How many altogether? ${a} + ${b} = ?`,
        options: shuffle([String(ans), String(ans + 1), String(ans - 1 < 0 ? ans + 2 : ans - 1)]),
        answer: String(ans),
      });
    }
  }

  // Ages 4-5: Subtraction
  for (let a = 3; a <= 9; a++) {
    const b = randInt(1, a - 1);
    const ans = a - b;
    lessons.push({
      age: "4-5", subject: "math", level: 4, reward: 8,
      story: `The ${pick(CHARACTERS)} had ${a} ${pick(ITEMS)} but gave away ${b}.`,
      question: `How many are left? ${a} − ${b} = ?`,
      options: shuffle([String(ans), String(ans + 1), String(ans + 2)]),
      answer: String(ans),
    });
  }

  // Ages 6-7: Addition up to 20
  for (let i = 0; i < 15; i++) {
    const a = randInt(5, 12);
    const b = randInt(3, 8);
    const ans = a + b;
    lessons.push({
      age: "6-7", subject: "math", level: 6, reward: 10,
      story: `The ${pick(CHARACTERS)} collected ${a} and ${b} more treasures!`,
      question: `What is ${a} + ${b}?`,
      options: shuffle([String(ans), String(ans + 2), String(ans - 2)]),
      answer: String(ans),
    });
  }

  // Ages 6-7: Multiplication basics
  const mulPairs: [number, number][] = [[2,2],[2,3],[2,4],[2,5],[3,3],[3,4],[5,2],[5,3],[10,2]];
  for (const [a, b] of mulPairs) {
    lessons.push({
      age: "6-7", subject: "math", level: 8, reward: 12,
      story: `The ${pick(CHARACTERS)} made ${a} groups of ${b} ${pick(ITEMS)}.`,
      question: `${a} × ${b} = ?`,
      options: shuffle([String(a * b), String(a * b + 2), String(a * b - 2)]),
      answer: String(a * b),
    });
  }

  return lessons;
}
