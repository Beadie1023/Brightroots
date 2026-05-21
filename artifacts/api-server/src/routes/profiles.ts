import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateProfileBody,
  UpdateProgressBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/profiles", async (req, res) => {
  try {
    const profiles = await db.select().from(profilesTable).orderBy(profilesTable.createdAt);
    res.json(profiles.map(serializeProfile));
  } catch (err) {
    req.log.error({ err }, "Failed to get profiles");
    res.status(500).json({ error: "Failed to get profiles" });
  }
});

router.post("/profiles", async (req, res) => {
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const [profile] = await db
      .insert(profilesTable)
      .values({ name: parsed.data.name, ageGroup: parsed.data.ageGroup })
      .returning();
    res.status(201).json(serializeProfile(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to create profile");
    res.status(500).json({ error: "Failed to create profile" });
  }
});

router.get("/profiles/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
    if (!profile) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeProfile(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to get profile");
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.delete("/profiles/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(profilesTable).where(eq(profilesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete profile");
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

router.put("/profiles/:id/progress", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateProgressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
    if (!profile) { res.status(404).json({ error: "Not found" }); return; }

    const { subject, correct, coins, streak } = parsed.data;
    const progress = (profile.progress as Record<string, number>) || {};
    const accuracy = (profile.accuracy as Record<string, number>) || {};

    if (subject && correct !== undefined) {
      const prevTotal = progress[subject] || 0;
      const prevCorrect = accuracy[subject] || 0;
      progress[subject] = prevTotal + 1;
      accuracy[subject] = (prevCorrect * prevTotal + (correct ? 1 : 0)) / (prevTotal + 1);
    }

    const [updated] = await db
      .update(profilesTable)
      .set({
        coins: coins !== undefined ? (profile.coins + coins) : profile.coins,
        streak: streak !== undefined ? streak : profile.streak,
        progress,
        accuracy,
        lastActive: new Date().toISOString().split("T")[0],
      })
      .where(eq(profilesTable.id, id))
      .returning();

    res.json(serializeProfile(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update progress");
    res.status(500).json({ error: "Failed to update progress" });
  }
});

router.get("/profiles/:id/stats", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
    if (!profile) { res.status(404).json({ error: "Not found" }); return; }

    const progress = (profile.progress as Record<string, number>) || {};
    const accuracy = (profile.accuracy as Record<string, number>) || {};

    const subjects = Object.keys(progress);
    let strongest: string | null = null;
    let weakest: string | null = null;
    let totalLessons = 0;
    const breakdown = subjects.map(s => {
      const total = progress[s] || 0;
      const acc = accuracy[s] || 0;
      const correct = Math.round(acc * total);
      totalLessons += total;
      return { subject: s, correct, total, accuracy: acc };
    });

    if (breakdown.length > 0) {
      breakdown.sort((a, b) => b.accuracy - a.accuracy);
      strongest = breakdown[0].subject;
      weakest = breakdown[breakdown.length - 1].subject;
    }

    const overallAccuracy = breakdown.length > 0
      ? breakdown.reduce((s, b) => s + b.accuracy, 0) / breakdown.length
      : 0;

    res.json({
      profileId: profile.id,
      strongestSubject: strongest,
      weakestSubject: weakest,
      totalLessons,
      totalCoins: profile.coins,
      overallAccuracy,
      subjectBreakdown: breakdown,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get profile stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

function serializeProfile(p: typeof profilesTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    ageGroup: p.ageGroup,
    coins: p.coins,
    streak: p.streak,
    progress: p.progress || {},
    accuracy: p.accuracy || {},
    createdAt: p.createdAt?.toISOString?.() ?? String(p.createdAt),
  };
}

export default router;
