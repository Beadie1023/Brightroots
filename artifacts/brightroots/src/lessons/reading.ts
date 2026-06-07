import type { LessonDef } from "./types";
import { pick, shuffle, CHARACTERS } from "./types";

export function buildReadingLessons(): LessonDef[] {
  const lessons: LessonDef[] = [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Ages 2-3: Letter recognition
  for (const letter of letters.slice(0, 10)) {
    lessons.push({
      age: "2-3", subject: "reading", level: 1, reward: 5,
      story: `Help ${pick(CHARACTERS)} find the letter!`,
      question: `Which letter is this? ${letter}`,
      options: shuffle([letter, letters[(letters.indexOf(letter) + 1) % 26], letters[(letters.indexOf(letter) + 5) % 26]]),
      answer: letter,
    });
  }

  // Ages 2-3: Letter sounds
  const phonics: [string, string][] = [
    ["A", "Apple 🍎"], ["B", "Ball ⚽"], ["C", "Cat 🐱"], ["D", "Dog 🐶"],
    ["E", "Egg 🥚"], ["S", "Sun ☀️"], ["T", "Tree 🌳"], ["M", "Moon 🌙"],
  ];
  for (const [letter, word] of phonics) {
    lessons.push({
      age: "2-3", subject: "reading", level: 2, reward: 5,
      story: `The ${pick(CHARACTERS)} loves the letter ${letter}!`,
      question: `${letter} is for _____`,
      options: shuffle([word, phonics.find(p => p[0] !== letter)?.[1] ?? "Ant 🐜", "Fish 🐟"]),
      answer: word,
    });
  }

  // Ages 4-5: Sight words
  const sightWords: [string, string][] = [
    ["The", "The cat sat on the mat."],
    ["A", "A big red ball."],
    ["Is", "The sky is blue."],
    ["In", "A bird in a tree."],
    ["It", "It is a dog."],
    ["We", "We can run."],
    ["Go", "Go to school."],
    ["See", "I see a bird."],
  ];
  for (const [word, sentence] of sightWords) {
    lessons.push({
      age: "4-5", subject: "reading", level: 3, reward: 8,
      story: `${pick(CHARACTERS)} is reading a sentence!`,
      question: `Find the word "${word}" in: "${sentence}"`,
      options: shuffle([word, "Cat", "Run"]),
      answer: word,
    });
  }

  // Ages 4-5: Phonics blends
  const blends: [string, string, [string, string, string]][] = [
    ["bl", "black", ["black", "back", "lack"]],
    ["tr", "tree",  ["tree",  "tee",  "free"]],
    ["st", "star",  ["star",  "tar",  "car"]],
    ["cl", "clap",  ["clap",  "cap",  "lap"]],
    ["gr", "green", ["green", "seen", "been"]],
  ];
  for (const [blend, word, opts] of blends) {
    lessons.push({
      age: "4-5", subject: "reading", level: 4, reward: 8,
      story: `The ${pick(CHARACTERS)} is learning blends!`,
      question: `The blend "${blend}" makes the word:`,
      options: shuffle(opts),
      answer: word,
    });
  }

  // Ages 6-7: Reading comprehension
  const passages: [string, string, [string, string, string]][] = [
    ["Tom has a red ball. He plays in the park.", "What color is Tom's ball?", ["Red", "Blue", "Green"]],
    ["The sun shines in the day. The moon shines at night.", "When does the moon shine?", ["At night", "In the day", "In the morning"]],
    ["Sara has a pet cat. The cat likes to sleep.", "What does Sara's cat like to do?", ["Sleep", "Run", "Swim"]],
    ["Birds have wings. They can fly high in the sky.", "What can birds do?", ["Fly", "Swim", "Bark"]],
    ["It rained all day. Jake wore his boots.", "Why did Jake wear boots?", ["It was raining", "It was sunny", "It was cold"]],
  ];
  for (const [passage, question, opts] of passages) {
    lessons.push({
      age: "6-7", subject: "reading", level: 5, reward: 10,
      story: passage,
      question,
      options: shuffle(opts),
      answer: opts[0],
    });
  }

  return lessons;
}
