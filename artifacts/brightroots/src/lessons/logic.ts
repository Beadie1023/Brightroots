import type { LessonDef } from "./types";
import { pick, shuffle, CHARACTERS } from "./types";

export function buildLogicLessons(): LessonDef[] {
  const lessons: LessonDef[] = [];
  const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink"];

  // Ages 2-3: Animal sounds
  const matching: [string, string, [string, string, string]][] = [
    ["🐱", "meow",  ["meow",  "woof",  "moo"]],
    ["🐶", "woof",  ["woof",  "meow",  "roar"]],
    ["🐄", "moo",   ["moo",   "oink",  "baa"]],
    ["🐷", "oink",  ["oink",  "cluck", "moo"]],
    ["🐔", "cluck", ["cluck", "roar",  "woof"]],
    ["🦁", "roar",  ["roar",  "meow",  "cluck"]],
  ];
  for (const [animal, sound, opts] of matching) {
    lessons.push({
      age: "2-3", subject: "logic", level: 1, reward: 5,
      story: `What sound does this animal make?`,
      question: `${animal} says...`,
      options: shuffle(opts),
      answer: sound,
    });
  }

  // Ages 2-3: Colors
  const colorItems: [string, string][] = [
    ["🍎", "red"], ["🍋", "yellow"], ["🍀", "green"],
    ["🔵", "blue"], ["🟣", "purple"], ["🟠", "orange"],
  ];
  for (const [emoji, color] of colorItems) {
    lessons.push({
      age: "2-3", subject: "logic", level: 2, reward: 5,
      story: `Help ${pick(CHARACTERS)} learn colors!`,
      question: `What color is ${emoji}?`,
      options: shuffle([color, ...colors.filter(c => c !== color).slice(0, 2)] as [string, string, string]),
      answer: color,
    });
  }

  // Ages 4-5: Odd one out
  const oddOnes: [string, [string, string, string]][] = [
    ["🍎 🍌 🐶 🍓", ["🍎 🍌 🐶 🍓", "🍎 🍌 🍇 🍓", "🍊 🍋 🍇 🍓"]],
    ["🐱 🐶 ⚽ 🐸", ["🐱 🐶 ⚽ 🐸", "🐱 🐶 🐯 🐸", "🐘 🐋 🦒 🐸"]],
    ["🍊 🍇 🚗 🍉", ["🍊 🍇 🚗 🍉", "🍊 🍇 🍋 🍉", "🍑 🍒 🍓 🍉"]],
  ];
  for (const [answer, opts] of oddOnes) {
    lessons.push({
      age: "4-5", subject: "logic", level: 3, reward: 8,
      story: `Find the one that doesn't belong!`,
      question: `Which group has an odd one out?`,
      options: opts,
      answer,
    });
  }

  // Ages 4-5: Pattern completion
  const patterns: [string, [string, string, string]][] = [
    ["🔴🔵🔴🔵🔴 ?", ["🔵", "🔴", "🟡"]],
    ["⭐🌙⭐🌙⭐ ?",  ["🌙", "⭐", "☀️"]],
    ["🐱🐶🐱🐶🐱 ?", ["🐶", "🐱", "🐸"]],
    ["1 2 3 1 2 3 1 ?", ["2", "3", "4"]],
    ["🌹🌻🌹🌻🌹 ?", ["🌻", "🌹", "🌷"]],
  ];
  for (const [pattern, opts] of patterns) {
    lessons.push({
      age: "4-5", subject: "logic", level: 4, reward: 8,
      story: `${pick(CHARACTERS)} loves patterns!`,
      question: `What comes next? ${pattern}`,
      options: shuffle(opts),
      answer: opts[0],
    });
  }

  // Ages 6-7: Analogies
  const comparisons: [string, string, [string, string, string]][] = [
    ["Hot is to cold as day is to ___",          "night",            ["night",           "sun",    "cloud"]],
    ["Puppy is to dog as kitten is to ___",       "cat",              ["cat",             "bird",   "fish"]],
    ["Big is to small as fast is to ___",         "slow",             ["slow",            "large",  "quick"]],
    ["Bird is to fly as fish is to ___",          "swim",             ["swim",            "run",    "jump"]],
    ["2 is to 4 as 3 is to ___",                 "6",                ["6",               "5",      "7"]],
    ["Apple is to fruit as rose is to ___",       "flower",           ["flower",          "leaf",   "tree"]],
  ];
  for (const [q, answer, opts] of comparisons) {
    lessons.push({
      age: "6-7", subject: "logic", level: 7, reward: 10,
      story: `${pick(CHARACTERS)} loves brain teasers!`,
      question: q,
      options: shuffle(opts),
      answer,
    });
  }

  return lessons;
}
