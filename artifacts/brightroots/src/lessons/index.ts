import type { Lesson, LessonDef } from "./types";
import { buildMathLessons } from "./math";
import { buildReadingLessons } from "./reading";
import { buildSpellingLessons } from "./spelling";
import { buildLogicLessons } from "./logic";
import { buildGrammarLessons } from "./grammar";
import { buildMoneyLessons } from "./money";

function compileLessons(defs: LessonDef[]): Lesson[] {
  return defs.map((def, i) => ({
    ...def,
    id: String(i + 1),
    reward: def.reward ?? defaultReward(def.subject),
  }));
}

function defaultReward(subject: string): number {
  const map: Record<string, number> = {
    math: 8, reading: 8, spelling: 8,
    logic: 8, grammar: 8, money: 8,
  };
  return map[subject] ?? 5;
}

export const ALL_LESSONS: Lesson[] = compileLessons([
  ...buildMathLessons(),
  ...buildReadingLessons(),
  ...buildSpellingLessons(),
  ...buildLogicLessons(),
  ...buildGrammarLessons(),
  ...buildMoneyLessons(),
]);
