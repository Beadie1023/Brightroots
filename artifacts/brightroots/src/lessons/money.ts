import type { LessonDef } from "./types";
import { pick, shuffle, CHARACTERS } from "./types";

export function buildMoneyLessons(): LessonDef[] {
  const lessons: LessonDef[] = [];

  // Ages 4-5: Coin recognition
  const coinValues: [string, string, [string, string, string]][] = [
    ["A penny is worth ___",    "1 cent",   ["1 cent",   "5 cents",  "10 cents"]],
    ["A nickel is worth ___",   "5 cents",  ["5 cents",  "1 cent",   "10 cents"]],
    ["A dime is worth ___",     "10 cents", ["10 cents", "5 cents",  "25 cents"]],
    ["A quarter is worth ___",  "25 cents", ["25 cents", "10 cents", "50 cents"]],
    ["Which coin is worth the most?", "Quarter", ["Quarter", "Penny", "Nickel"]],
  ];
  for (const [question, answer, opts] of coinValues) {
    lessons.push({
      age: "4-5", subject: "money", level: 3, reward: 8,
      story: `Welcome to Money Town! ${pick(CHARACTERS)} needs help with coins!`,
      question,
      options: shuffle(opts),
      answer,
    });
  }

  // Ages 4-5: Counting groups of coins
  const coinGroups: [string, string, [string, string, string]][] = [
    ["5 pennies = ___",   "5 cents",  ["5 cents",  "10 cents", "1 cent"]],
    ["2 nickels = ___",   "10 cents", ["10 cents", "5 cents",  "15 cents"]],
    ["2 dimes = ___",     "20 cents", ["20 cents", "10 cents", "30 cents"]],
    ["4 quarters = ___",  "$1.00",    ["$1.00",    "50 cents", "75 cents"]],
  ];
  for (const [question, answer, opts] of coinGroups) {
    lessons.push({
      age: "4-5", subject: "money", level: 4, reward: 8,
      story: `Count the coins with ${pick(CHARACTERS)}!`,
      question,
      options: shuffle(opts),
      answer,
    });
  }

  // Ages 6-7: Earning & saving
  const earnSave: [string, string, [string, string, string]][] = [
    ["If you earn $5 and save $2, how much do you spend?",     "$3", ["$3", "$2", "$7"]],
    ["You have $10. You buy a toy for $6. How much is left?",  "$4", ["$4", "$6", "$3"]],
    ["You save $1 every day for 5 days. How much do you have?","$5", ["$5", "$6", "$4"]],
    ["A book costs $8. You have $5. How much more do you need?","$3",["$3", "$2", "$4"]],
    ["You earn $3 for chores. You spend $1. How much saved?",  "$2", ["$2", "$3", "$1"]],
  ];
  for (const [question, answer, opts] of earnSave) {
    lessons.push({
      age: "6-7", subject: "money", level: 6, reward: 10,
      story: `${pick(CHARACTERS)} is learning to manage money!`,
      question,
      options: shuffle(opts),
      answer,
    });
  }

  // Ages 6-7: Budget choices
  const budget: [string, string, [string, string, string]][] = [
    ["You have $5. A toy costs $8. Can you buy it?",                             "No",                   ["No",                  "Yes",            "Maybe"]],
    ["Which is better: spend all coins or save some?",                           "Save some",            ["Save some",           "Spend all",      "Give all away"]],
    ["If something costs $3 and you have $5, you get ___ change.",               "$2",                   ["$2",                  "$3",             "$1"]],
    ["A need is something you ___ and a want is something you ___.",             "must have / like to have", ["must have / like to have", "like to have / must have", "buy / sell"]],
  ];
  for (const [question, answer, opts] of budget) {
    lessons.push({
      age: "6-7", subject: "money", level: 7, reward: 10,
      story: `Money Town Budget Challenge with ${pick(CHARACTERS)}!`,
      question,
      options: shuffle(opts),
      answer,
    });
  }

  return lessons;
}
