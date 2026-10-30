# VYBE — Product Requirements (v0.1)

> "Find someone on your wavelength." Discover someone's world before discovering their face.

## 1. Problem

Mainstream dating and social apps rank people by photos. That rewards appearance, produces swipe fatigue, and makes friendship, culture and shared activities second-class. Newcomers, international students and people from smaller cultural communities in Sydney find it hard to meet people who share their language, tastes and plans. Most of the apps that do exist expose more location detail than users realise.

## 2. Product

VYBE is a mobile-first web app for adults (18+). Members are publicly anonymous: a nickname and a stylised 3D avatar. They are discovered through detailed interests (their **VYBE DNA**), shared languages, intentions and approximate suburb-level proximity. Discovery leads to **consented** connections, conversations, communities and real-world group activities.

## 3. Target users (Sydney launch)

| Segment | Need |
|---|---|
| Newcomers and international students | Friends who share their language and culture, and local activity buddies |
| Culturally rooted adults (e.g. Bengali, South Asian, East Asian communities) | Community, plus dating within or across cultures, on their own terms |
| Interest-first people | Cinema partners, gaming squads, road-trip groups, food explorers |
| Privacy-conscious daters | Getting to know someone before showing their face or exact location |

## 4. Principles

1. **World before face.** Interests, language and intent come first. Photos are private and only used to generate avatars.
2. **Consent gates contact.** Nobody can message anyone until a connection request has been accepted. Compatibility never overrides preferences.
3. **Approximate, never exact.** Location is a ranking signal expressed in broad tiers. We never show coordinates, distances or another user's suburb without their opt-in.
4. **Explainable, not scientific.** Compatibility is explained in plain language ("You both love…"). It is not shown as an authoritative percentage.
5. **Honest activity.** The Pulse shows only real, aggregated, threshold-protected activity. We never seed fake members in production.
6. **Novel but usable.** Every spatial view (Orbit, Galaxy, Radar) has an accessible list equivalent, supports reduced motion and degrades on low-power devices.

## 5. MVP scope (private beta, Sydney)

### In the MVP
- **Accounts:** Supabase Auth with email + password and email magic link, an 18+ gate (date of birth plus attestation), and account deletion.
- **Onboarding:** nickname, gender, who you want to connect with, intentions (dating, friendship, both, communities only), languages, social energy, home suburb, then interests.
- **VYBE DNA:** hierarchical interests managed by admins in the database, per-interest visibility, and a visual DNA profile.
- **Discovery:** a server-side eligibility and scoring function with PostGIS suburb-centroid tiers. **Radar** (Orbit view plus list view) and explainable match panels.
- **Connections:** interest requests, accept/decline, mutual matches, unmatching, Conversation Sparks and realtime 1:1 chat.
- **Safety:** blocking, reporting, a moderation queue, rate limits, audit logs and RLS on every table.
- **Communities:** join and leave, posts, comments, reactions and rules. Moderators can hide content.
- **Avatar Studio:** a procedurally built, customisable real-3D avatar (React Three Fiber) in three modes (Mystery, Signature and Realistic placeholder). The user must approve an avatar before it is published.
- **Admin:** reports, users, moderation actions, communities and taxonomy CRUD.

### Deferred until after the MVP
Photo-assisted avatar generation (async provider), identity and liveness verification provider, Taste Galaxy 3D worlds, The Pulse aggregation, Same Tonight, VYBE Rooms, Weekend Missions, Anonymous Stories, events with RSVPs, extended discovery outside Sydney, and push notifications.

### Non-goals
Swipe decks, public photo grids, exact-distance display, live location tracking, unrestricted anonymous DMs, and inferring ethnicity or any attribute from photos.

## 6. Success metrics (beta)
- At least 70% of users who start onboarding complete it.
- At least 30% of weekly active users send a connection request.
- At least 40% of connection requests are accepted.
- At least 50% of matches lead to a conversation with 5 or more messages.
- Reports per 1,000 messages are tracked, and median moderation response is under 24 hours.

## 7. Compliance checkpoints (before public launch)
Get legal review of the following. These are inputs to that review, not legal advice:
- Privacy Act 1988 (APPs), including notifiable data breaches.
- Online Safety Act 2021 and the eSafety Commissioner codes and standards.
- The Australian online dating industry code (in force since 2025), which covers safety policies, support, and handling of banned users.
- Age-assurance expectations.
- Australian Consumer Law for any paid features.
- Biometric data: the face photos used for avatars or liveness checks are sensitive information.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Location triangulation | Tiered output, minimum-population tiers, no distances, query rate limits and stable ordering (see `06-location-privacy.md`) |
| Harassment via anonymity | Consent-gated messaging, verification badges, fast blocking, report escalation and repeat-offender bans |
| Cold start (an empty Orbit) | Communities-first onboarding, wider tiers when local supply is thin, honest empty states |
| Scraping | Small paginated pages, per-user rate limits, no public profile URLs, RLS |
| 3D performance on cheap phones | Low-poly procedural avatars, 2D fallback snapshots, device capability detection |
