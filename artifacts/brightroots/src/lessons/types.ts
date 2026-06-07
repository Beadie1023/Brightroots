export type AgeGroup = "2-3" | "4-5" | "6-7";
export type Subject = "math" | "reading" | "spelling" | "logic" | "grammar" | "money";

export interface LessonDef {
  age: AgeGroup;
  subject: Subject;
  level: number;
  story: string;
  question: string;
  options: [string, string, string];
  answer: string;
  reward?: number;
}

export interface Lesson extends LessonDef {
  id: string;
  reward: number;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: readonly T[]): [T, T, T] {
  const a = [...arr] as T[];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a as [T, T, T];
}

export function getWrongLetters(correct: string, count: number): string[] {
  const vowels = "aeiou";
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const pool = vowels.includes(correct) ? vowels : consonants;
  const result: string[] = [];
  for (const l of pool) {
    if (l !== correct && result.length < count) result.push(l);
  }
  return result;
}

export const CHARACTERS = ["monkey 🐒", "pirate 🏴‍☠️", "robot 🤖", "lion 🦁", "astronaut 🚀", "wizard 🧙", "princess 👸", "dino 🦕"];
export const ITEMS = ["🍎", "🍌", "⭐", "⚽", "🎁", "🍭", "🚀", "💎", "🦋", "🌈"];
