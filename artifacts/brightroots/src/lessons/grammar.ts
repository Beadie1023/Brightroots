import type { LessonDef } from "./types";
import { pick, shuffle, CHARACTERS } from "./types";

export function buildGrammarLessons(): LessonDef[] {
  const lessons: LessonDef[] = [];

  // Ages 4-5: Nouns
  const nouns: [string, [string, string, string]][] = [
    ["Which word is a noun (person, place, or thing)?", ["dog",     "run",   "happy"]],
    ["Which word is a noun?",                           ["apple",   "jump",  "fast"]],
    ["Which word is a noun?",                           ["school",  "sing",  "blue"]],
    ["Which word is a noun?",                           ["bird",    "fly",   "quick"]],
    ["Which word names a person?",                      ["teacher", "sleep", "tall"]],
  ];
  for (const [question, opts] of nouns) {
    lessons.push({
      age: "4-5", subject: "grammar", level: 3, reward: 8,
      story: `${pick(CHARACTERS)} is learning grammar!`,
      question,
      options: shuffle(opts),
      answer: opts[0],
    });
  }

  // Ages 4-5: Verbs
  const verbs: [string, [string, string, string]][] = [
    ["Which word is a verb (action)?",       ["run",  "cat",   "big"]],
    ["Which word shows an action?",          ["jump", "tree",  "happy"]],
    ["Which word is a verb?",                ["sing", "apple", "tall"]],
    ["Which word describes what you do?",    ["eat",  "house", "pretty"]],
  ];
  for (const [question, opts] of verbs) {
    lessons.push({
      age: "4-5", subject: "grammar", level: 4, reward: 8,
      story: `The ${pick(CHARACTERS)} is learning verbs!`,
      question,
      options: shuffle(opts),
      answer: opts[0],
    });
  }

  // Ages 6-7: Sentence completion (subject-verb agreement)
  const sentences: [string, string, [string, string, string]][] = [
    ["The dog ___ in the park.",          "plays", ["plays",   "play",   "playing"]],
    ["She ___ a beautiful song.",         "sings", ["sings",   "sing",   "sang"]],
    ["They ___ to school every day.",     "go",    ["go",      "goes",   "going"]],
    ["He ___ his homework last night.",   "did",   ["did",     "does",   "do"]],
    ["The birds ___ south for winter.",   "fly",   ["fly",     "flies",  "flied"]],
    ["I ___ very happy today.",           "am",    ["am",      "is",     "are"]],
  ];
  for (const [sentence, answer, opts] of sentences) {
    lessons.push({
      age: "6-7", subject: "grammar", level: 5, reward: 10,
      story: `${pick(CHARACTERS)} needs help with the sentence!`,
      question: `Choose the correct word: "${sentence}"`,
      options: shuffle(opts),
      answer,
    });
  }

  // Ages 6-7: Punctuation
  const punctuation: [string, string, [string, string, string]][] = [
    ["Which sentence uses correct punctuation?",  "The cat sat on the mat.", ["The cat sat on the mat.", "the cat sat on the mat", "The cat sat on the mat!?"]],
    ["A question should end with:",               "?",                       ["?",  ".",  "!"]],
    ["An exclamation should end with:",           "!",                       ["!",  ".",  "?"]],
    ["Which is a complete sentence?",             "The bird flew away.",     ["The bird flew away.", "bird flew", "the bird"]],
  ];
  for (const [question, answer, opts] of punctuation) {
    lessons.push({
      age: "6-7", subject: "grammar", level: 6, reward: 10,
      story: `The ${pick(CHARACTERS)} is mastering punctuation!`,
      question,
      options: shuffle(opts),
      answer,
    });
  }

  return lessons;
}
