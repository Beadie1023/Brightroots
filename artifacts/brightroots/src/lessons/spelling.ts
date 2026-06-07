import type { LessonDef } from "./types";
import { pick, shuffle, getWrongLetters, CHARACTERS } from "./types";

export function buildSpellingLessons(): LessonDef[] {
  const lessons: LessonDef[] = [];

  // Ages 4-5: Missing middle letter
  const words3: [string, string][] = [
    ["cat", "c_t"], ["dog", "d_g"], ["sun", "s_n"], ["hat", "h_t"],
    ["run", "r_n"], ["cup", "c_p"], ["bed", "b_d"], ["fox", "f_x"],
  ];
  for (const [word, blank] of words3) {
    const missing = word[1];
    lessons.push({
      age: "4-5", subject: "spelling", level: 3, reward: 8,
      story: `Help the ${pick(CHARACTERS)} complete the word!`,
      question: `Fill the blank: ${blank}`,
      options: shuffle([missing, ...getWrongLetters(missing, 2)] as [string, string, string]),
      answer: missing,
    });
  }

  // Ages 4-5: Choose the correct spelling
  const spellingOpts: [string, [string, string, string]][] = [
    ["cake", ["cake", "caek", "cakk"]],
    ["bike", ["bike", "biek", "biik"]],
    ["fish", ["fish", "fesh", "fich"]],
    ["jump", ["jump", "jupm", "jamp"]],
    ["play", ["play", "plae", "plya"]],
  ];
  for (const [word, opts] of spellingOpts) {
    lessons.push({
      age: "4-5", subject: "spelling", level: 4, reward: 8,
      story: `The ${pick(CHARACTERS)} is learning to spell!`,
      question: `Which spelling is correct?`,
      options: shuffle(opts),
      answer: word,
    });
  }

  // Ages 6-7: Longer words
  const words6: [string, [string, string, string]][] = [
    ["happy",     ["happy",     "hapy",      "hapie"]],
    ["friend",    ["friend",    "freind",     "frend"]],
    ["beautiful", ["beautiful", "beutiful",   "beautyful"]],
    ["because",   ["because",   "becaus",     "beacuse"]],
    ["through",   ["through",   "throgh",     "thru"]],
    ["different", ["different", "diferent",   "diffrent"]],
    ["together",  ["together",  "togethr",    "togther"]],
    ["always",    ["always",    "allways",    "alwys"]],
  ];
  for (const [word, opts] of words6) {
    lessons.push({
      age: "6-7", subject: "spelling", level: 6, reward: 10,
      story: `The ${pick(CHARACTERS)} challenges you to spell!`,
      question: `Which spelling is correct?`,
      options: shuffle(opts),
      answer: word,
    });
  }

  return lessons;
}
