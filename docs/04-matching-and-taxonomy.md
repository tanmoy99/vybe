# VYBE — Interest Taxonomy and Matching

## 1. Taxonomy model

```
interest_categories      (slug, name, world_name, icon, colour_token, sort, is_active)
  └─ interest_subcategories (category_id, slug, name, kind)        kind: 'choice' | 'scale' | 'free_text'
       └─ interest_options   (subcategory_id, slug, name, is_active)
user_interests           (user_id, option_id, intensity 1–3, social_mode, visibility)
user_interest_details    (user_id, subcategory_id, text ≤ 140, visibility)   e.g. favourite films
compatibility_questions  (category_id?, prompt, answer_type, options jsonb, is_active)
user_compatibility_answers (user_id, question_id, answer jsonb, visibility)
```

- **Admins** add categories, subcategories and options from the admin console. The UI renders from data, so nothing is hard-coded.
- **`social_mode`** describes how the user wants to share an interest: `solo` | `with_partner` | `with_friends` | `with_group` | `any`.
- **`visibility`** is one of `public` (shown and used for matching), `matching_only` (used for scoring but never displayed), or `private` (neither).
- Dealbreakers are stored as `user_compatibility_answers` with `answer.dealbreaker = true`. They are applied as **soft filters**: excluded from the top tiers and never shown.

### Seed categories (Phase 2)

| World | Subcategories (examples) |
|---|---|
| **Cinema Planet** | Industries (Hollywood, Bollywood, Bengali cinema, K-drama, anime, European, indie) · Genres (psychological thriller … animation) · Viewing (cinema/streaming, subtitles/dubbing) · Favourite films/directors (free text) · Wants a cinema partner |
| **Music Galaxy** | Genres (Bengali, Bollywood, K-pop … folk) · Favourite artists/songs (free text) · Concerts (often/sometimes/never) · Playlist sharing |
| **Road Trip Island** | Trip types (night drives, coastal, mountain … photography) · Role (driver/passenger/either) · Duration (day/overnight) · Group size · Budget · Planning style · Comfortable distance band · Wants a travel group |
| **Food Street** | Cuisines · Spice tolerance · Cafe/street/fine dining · Cooking · Dietary (private by default) · Food buddy |
| **Gaming Dimension** | Platforms · Titles (EA FC, Valorant, Minecraft, GTA, Fortnite …) · Genres (RPG, co-op) · Competitive/casual · Play times · Voice/text |
| **Deep Talks Lounge** | Social energy · Group size · Conversation depth · Spontaneous/organised · Morning/night · Message frequency |
| **Culture Circle** | Festivals · Cultural communities (voluntary) · Volunteering |
| **Tech Universe** | Technology, cybersecurity, entrepreneurship |
| More | Books, photography, fitness, pets, sports, art, outdoors |

The Road Trip "comfortable distance" is stored as a band, never as routes or a schedule, and is never displayed publicly.

## 2. Matching pipeline

```
1. Hard eligibility (SQL, inside discover_candidates RPC) — nothing below can override these
   - both accounts active, onboarded, 18+, not suspended
   - candidate discoverable and not paused; viewer not paused
   - no block in either direction
   - intent compatibility (see matrix)
   - dating: viewer.gender ∈ candidate.dating_genders AND candidate.gender ∈ viewer.dating_genders
             and both ages within each other's age range
   - candidate's location tier ≤ viewer's max tier AND viewer's tier ≤ candidate's max tier
   - not already matched / pending request / recently dismissed
2. Tiering (PostGIS, suburb centroids): T1 same suburb · T2 ≤ 5 km · T3 ≤ 15 km · T4 Greater Sydney · T5 extended
3. Scoring (weights are config, not science)
4. Ordering: tier ASC, score DESC, then stable seeded jitter (per viewer per day) to avoid exact-rank leakage
5. Diversity: max 2 consecutive candidates sharing the same top category; recently-shown down-weighted
6. Output: public-safe card fields + explanation strings + tier label (never distance/suburb unless opted in)
```

### Intent compatibility

| viewer \ candidate | dating | friendship | both | communities |
|---|---|---|---|---|
| dating | ✔ (dating rules) | — | ✔ (dating rules) | — |
| friendship | — | ✔ | ✔ | — |
| both | ✔ (dating rules) | ✔ | ✔ | — |
| communities | — | — | — | — (they discover through Worlds only) |

When two "both" users match, the dating rules apply only if both are mutually dating-eligible. Otherwise the match is treated as a friendship match and labelled as one.

### Score (0–1) — starting weights

| Component | Weight | Computation |
|---|---|---|
| Shared interests | 0.30 | Weighted Jaccard over `public` and `matching_only` options. The weight is `min(intensity_a, intensity_b)`; a match on a rarer option counts more (IDF over active users) |
| Proximity | 0.20 | T1 = 1.0, T2 = 0.8, T3 = 0.55, T4 = 0.3, T5 = 0.1 |
| Intentions | 0.20 | Exact intent = 1.0; "both" overlap = 0.7; age-range comfort |
| Language | 0.10 | 1.0 if they share a preferred chat language; 0.6 if any shared language at conversational level or above; 0.3 if one is learning the other's language; 0 otherwise |
| Activities | 0.10 | Overlap of `social_mode` and activity subcategories (trip types, gaming times) |
| Communication | 0.10 | Similarity of social energy, conversation depth, message frequency and chronotype |

The score is **never displayed as a percentage**. The UI shows two or three explanation sentences built from the top contributing components, including honest differences:

- "You both love late-night drives, Korean thrillers and Bengali music."
- "You're both deep-conversation people."
- "Your movie tastes overlap, but your travel styles are different."

The scoring logic lives in `src/lib/matching` as a pure, unit-tested TypeScript module. The SQL RPC mirrors it, and fixtures are shared between the two so they can't drift apart.

### Feature modes reuse the same pipeline
- **Taste Twin:** rank by shared-interest score only, with a minimum of 5 shared specific options.
- **Opposite VYBE:** the hard filters still apply, plus required shared language and intent. Rank by a high communication score combined with *moderate* interest overlap (0.15–0.35). An incompatible person is never shown as a match.
