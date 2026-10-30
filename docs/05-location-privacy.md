# VYBE — Location Privacy System

## Data we store
- `suburbs`: public reference data (name, state, postcode, centroid, optional boundary). **Source: ABS ASGS Edition 3 "Suburbs and Localities" (SAL) 2021 digital boundaries, © Australian Bureau of Statistics, CC BY 4.0.** Centroids are computed in PostGIS (`ST_PointOnSurface`) from the official polygons; none are hand-entered. Postcodes come from a separately licensed source (ABS POA correspondence) and are only used to help people search.
- `user_location_preferences.home_suburb_id`: the only location we keep per user.
- **No GPS storage.** Browser geolocation is optional and only used client-side to *suggest* a suburb. The coordinate goes to a server action that returns the containing suburb id and is not persisted or logged.

## Data we never return
Coordinates, distances in km, a suburb (unless the subject enabled `show_area_label`), exact rank by distance, or "last active" timestamps more precise than "active this week".

## Tiers

| Tier | Rule (centroid distance) | Label shown |
|---|---|---|
| T1 | Same suburb | "Same local area" (merged with T2 for display) |
| T2 | ≤ 5 km | "Same local area" |
| T3 | ≤ 15 km | "Nearby area" |
| T4 | Same greater capital city statistical area (Greater Sydney) | "Greater Sydney" |
| T5 | Other cities (opt-in extended discovery) | "Further away" |

T1 and T2 are deliberately **merged in the label**, so nobody can tell "same suburb" from "a nearby suburb". They're only distinguished internally for ranking.

## Anti-triangulation controls
1. **Suburb-level granularity.** Every person in a suburb shares one centroid, so trilateration can at best reveal the suburb, and that is only exposed through ranking.
2. **k-anonymity floor.** If a suburb has fewer than *k* (= 10) discoverable users, its users are ranked as T3 for others (their tier is "coarsened").
3. **Stable seeded jitter.** Within a tier, ordering uses `hash(viewer_id, candidate_id, date)`, so repeated queries don't leak fine-grained rank.
4. **Suburb change limits.** A user can change their home suburb at most 3 times per 30 days, so nobody can "walk" their suburb to triangulate others. Each change is audit-logged.
5. **Query rate limits.** Discovery pages are capped per user per hour (`discovery_requests` log). Burst patterns are flagged for review.
6. **No relative signals in other places.** Communities and The Pulse use aggregated counts with a minimum audience threshold (≥ 5 people) and city-level wording.

## User controls (`user_privacy_settings`, `discovery_preferences`)
- `discoverable`: appear in Radar or Orbit at all.
- `discovery_paused`: temporary pause.
- `hide_from_local`: never appear in T1–T3, only in T4 and above.
- `show_area_label`: show "Near Bankstown"-style labels (suburb name only, never the street).
- `max_tier`: the widest tier I discover and am discovered in (mutual).
- Plus the ability to change your home suburb (rate-limited) and block users (symmetric removal from all discovery).

Location is a **ranking signal only**. A T1 candidate who isn't mutually eligible is never shown, and proximity never unlocks messaging.
