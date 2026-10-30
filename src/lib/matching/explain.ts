/**
 * Human-readable match explanations and conversation sparks. Pure functions:
 * the database decides who is eligible and how they rank; this turns the
 * public-safe features it returns into honest sentences. Never a percentage.
 */

export type SharedItem = { name: string; category: string; world: string; love: boolean };

export type MatchFeatures = {
  shared: SharedItem[];
  shared_hidden_count: number;
  shared_languages: string[];
  social_energy: string | null;
  conversation_depth: string | null;
  chronotype: string | null;
  planning_style: string | null;
};

export type ViewerStyle = Pick<MatchFeatures, "social_energy" | "conversation_depth" | "chronotype" | "planning_style">;

export const TIER_LABEL: Record<number, string> = {
  2: "Same local area",
  3: "Nearby area",
  4: "Greater Sydney",
  5: "Further away",
};

export const WAVELENGTH_LABEL: Record<number, string> = {
  3: "Strong wavelength",
  2: "Good wavelength",
  1: "Some common ground",
};

export const INTENT_LABEL: Record<string, string> = {
  dating: "Dating",
  friendship: "Friendship",
  both: "Friendship & dating",
  communities: "Communities",
};

export const CONNECTION_KIND_LABEL: Record<string, string> = {
  dating: "Dating match",
  friendship: "Friendship match",
  dating_or_friendship: "Friendship or dating",
};

export function listJoin(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Lower-case generic interest names mid-sentence, but keep proper nouns (K-pop, Bengali, Valorant). */
function inSentence(name: string) {
  const genericStart = /^(psychological|horror|romance|comedy|science|mystery|action|documentary|fantasy|crime|animation|drama|spontaneous|coastal|mountain|scenic|waterfalls|camping|hiking|long-distance|weekend|sunrise|sunset|food-focused|photography|cafe|street|fine|food|dessert|home|indie|lo-fi|folk|pop|rock|classical|jazz|metal|philosophy|psychology|life|relationships|spirituality|career|mental|society|space|history|gym|running|yoga|swimming|beach|cycling|rock|martial|dance|literary|poetry|non-fiction|thrillers|drawing|music|writing|film-making|fashion|crafts|cultural|volunteering|language|traditional|community|software|data|design|gadgets|robotics|startups|rpgs|co-op|battle|strategy|sports|fighting|dogs|cats|birds)/i;
  return genericStart.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

export function explainMatch(c: MatchFeatures, me: ViewerStyle): string[] {
  const out: string[] = [];

  const loved = c.shared.filter((s) => s.love);
  const top = (loved.length ? [...loved, ...c.shared.filter((s) => !s.love)] : c.shared).slice(0, 3);
  if (top.length > 0) {
    out.push(`You both ${loved.length ? "love" : "enjoy"} ${listJoin(top.map((s) => inSentence(s.name)))}.`);
  } else if (c.shared_hidden_count > 0) {
    out.push("You have interests in common that they keep off their profile.");
  }

  if (c.shared_languages.length > 0) {
    out.push(`You can both chat in ${listJoin(c.shared_languages.slice(0, 3))}.`);
  }

  const style: string[] = [];
  if (c.conversation_depth === "deep" && me.conversation_depth === "deep") style.push("You're both deep-conversation people.");
  if (c.chronotype === "night" && me.chronotype === "night") style.push("You're both night owls.");
  if (c.chronotype === "morning" && me.chronotype === "morning") style.push("You're both early risers.");
  if (c.social_energy === "introvert" && me.social_energy === "introvert") style.push("You both recharge with quiet time.");
  if (c.social_energy === "extrovert" && me.social_energy === "extrovert") style.push("You both get energy from people.");
  if (style[0]) out.push(style[0]);

  // Honest differences make better conversations than pretending everything matches.
  const plans = new Set([c.planning_style, me.planning_style]);
  if (plans.has("spontaneous") && plans.has("organised")) {
    out.push("One of you plans ahead and the other goes with the flow.");
  } else {
    const depths = new Set([c.conversation_depth, me.conversation_depth]);
    if (depths.has("deep") && depths.has("light")) out.push("One of you loves deep talks, the other keeps it light.");
  }

  return out.slice(0, 3);
}

const SPARKS: Record<string, (name: string) => string> = {
  cinema: (n) => `You both picked ${n}. Which film would you make everyone watch at least once?`,
  music: (n) => `You both listen to ${n}. What's on repeat for you right now?`,
  "road-trips": (n) => `${n} came up for both of you. What's the best one you've done around Sydney?`,
  food: (n) => `${n} is on both your lists. Where's the best spot you've found in Sydney?`,
  gaming: (n) => `You're both into ${n}. How did you get started?`,
  "deep-talks": (n) => `${n} is one of your shared topics. What's a question about it you can't stop thinking about?`,
  culture: (n) => `${n} matters to you both. What's your favourite memory of it?`,
  books: (n) => `You both read ${n}. What's one book you'd hand to a stranger?`,
};

/** Template-based (no AI): built only from mutually public interests. */
export function conversationSpark(shared: SharedItem[]): string {
  const pick = shared.find((s) => s.love) ?? shared[0];
  if (!pick) return "What's something you're looking forward to this week?";
  const make = SPARKS[pick.category];
  return make ? make(pick.name) : `You both love ${inSentence(pick.name)}. What's the story behind that for you?`;
}
