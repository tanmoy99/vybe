import { describe, expect, it } from "vitest";
import { conversationSpark, explainMatch, listJoin, type MatchFeatures } from "@/lib/matching/explain";

const base: MatchFeatures = {
  shared: [],
  shared_hidden_count: 0,
  shared_languages: [],
  social_energy: "ambivert",
  conversation_depth: "both",
  chronotype: "flexible",
  planning_style: "mix",
};
const me = { social_energy: "ambivert", conversation_depth: "both", chronotype: "flexible", planning_style: "mix" };

describe("listJoin", () => {
  it("joins naturally", () => {
    expect(listJoin(["a"])).toBe("a");
    expect(listJoin(["a", "b"])).toBe("a and b");
    expect(listJoin(["a", "b", "c"])).toBe("a, b and c");
  });
});

describe("explainMatch", () => {
  it("leads with shared loves, like the brief's example", () => {
    const lines = explainMatch(
      {
        ...base,
        shared: [
          { name: "Spontaneous night drives", category: "road-trips", world: "Road Trip Island", love: true },
          { name: "Korean films & K-dramas", category: "cinema", world: "Cinema Planet", love: true },
          { name: "Bengali music", category: "music", world: "Music Galaxy", love: true },
        ],
      },
      me,
    );
    expect(lines[0]).toBe("You both love spontaneous night drives, Korean films & K-dramas and Bengali music.");
  });

  it("says 'enjoy' when nothing is loved by both", () => {
    const lines = explainMatch({ ...base, shared: [{ name: "Valorant", category: "gaming", world: "Gaming Dimension", love: false }] }, me);
    expect(lines[0]).toBe("You both enjoy Valorant.");
  });

  it("mentions hidden overlap without naming it", () => {
    const lines = explainMatch({ ...base, shared_hidden_count: 2 }, me);
    expect(lines[0]).toMatch(/keep off their profile/);
  });

  it("covers languages and shared style", () => {
    const lines = explainMatch(
      { ...base, shared_languages: ["Bengali", "English"], conversation_depth: "deep" },
      { ...me, conversation_depth: "deep" },
    );
    expect(lines).toContain("You can both chat in Bengali and English.");
    expect(lines).toContain("You're both deep-conversation people.");
  });

  it("is honest about differences", () => {
    const lines = explainMatch({ ...base, planning_style: "spontaneous" }, { ...me, planning_style: "organised" });
    expect(lines).toContain("One of you plans ahead and the other goes with the flow.");
  });

  it("never returns more than three lines or a percentage", () => {
    const lines = explainMatch(
      {
        ...base,
        shared: [{ name: "Cats", category: "pets", world: "Pet Park", love: true }],
        shared_languages: ["English"],
        conversation_depth: "deep",
        chronotype: "night",
        planning_style: "spontaneous",
      },
      { social_energy: "introvert", conversation_depth: "deep", chronotype: "night", planning_style: "organised" },
    );
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.join(" ")).not.toMatch(/%/);
  });
});

describe("conversationSpark", () => {
  it("uses a category template from a mutually public interest", () => {
    expect(conversationSpark([{ name: "Coastal drives", category: "road-trips", world: "Road Trip Island", love: true }])).toBe(
      "Coastal drives came up for both of you. What's the best one you've done around Sydney?",
    );
  });

  it("prefers loved items and has a neutral fallback", () => {
    expect(
      conversationSpark([
        { name: "Pop", category: "music", world: "Music Galaxy", love: false },
        { name: "EA FC", category: "gaming", world: "Gaming Dimension", love: true },
      ]),
    ).toMatch(/EA FC/);
    expect(conversationSpark([])).toMatch(/looking forward to/);
  });
});
