import { beforeAll, describe, expect, it } from "vitest";
import { as, createDb, type Db } from "./harness";
import { discover, makeMember, seedTestGeography } from "./members";

let db: Db;

beforeAll(async () => {
  db = await createDb();
  await seedTestGeography(db);
});

const rpc = <T = unknown>(uid: string, sql: string, params: unknown[] = []) =>
  as(db, "authenticated", uid, async (tx) => (await tx.query<{ r: T }>(`select ${sql} as r`, params)).rows[0]?.r);

const request = (from: string, to: string, kind: string | null = null, note: string | null = null) =>
  rpc<string>(from, "public.send_connection_request($1, $2, $3)", [to, kind, note]);

const send = (uid: string, conv: string, body: string) =>
  as(db, "authenticated", uid, (tx) =>
    tx.query("insert into public.messages (conversation_id, sender_id, body) values ($1, $2, $3)", [conv, uid, body]),
  );

async function connected() {
  const a = await makeMember(db);
  const b = await makeMember(db);
  const req = await request(a, b);
  const conv = await rpc<string>(b, "public.respond_connection_request($1, true)", [req]);
  return { a, b, conv: conv! };
}

describe("connection requests", () => {
  it("requires the recipient to be eligible for the sender", async () => {
    const man = await makeMember(db, { gender: "man", intent: "dating", datingGenders: ["woman"] });
    const womanSeekingWomen = await makeMember(db, { gender: "woman", intent: "dating", datingGenders: ["woman"] });
    await expect(request(man, womanSeekingWomen)).rejects.toThrow(/VYBE_CANNOT_REQUEST/);
  });

  it("can't be sent to someone who blocked you", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    await rpc(b, "public.block_user($1)", [a]);
    await expect(request(a, b)).rejects.toThrow(/VYBE_CANNOT_REQUEST/);
  });

  it("notifies the recipient and hides the pair from each other's discovery", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    await request(a, b, null, "Loved your night drive picks");
    const notes = await as(db, "authenticated", b, async (tx) => (await tx.query<{ kind: string }>("select kind from public.notifications")).rows);
    expect(notes.map((n) => n.kind)).toContain("connection_request");
    expect((await discover(db, a)).map((r) => r.candidate_id)).not.toContain(b);
    expect((await discover(db, b)).map((r) => r.candidate_id)).not.toContain(a);
  });

  it("mutual requests become a match automatically", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    await request(a, b);
    await request(b, a);
    const { rows } = await db.query("select 1 from public.matches where ended_at is null and $1 in (user_a, user_b) and $2 in (user_a, user_b)", [a, b]);
    expect(rows).toHaveLength(1);
  });

  it("respects a decline for 30 days", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    const req = await request(a, b);
    await rpc(b, "public.respond_connection_request($1, false)", [req]);
    await expect(request(a, b)).rejects.toThrow(/VYBE_CANNOT_REQUEST/);
  });

  it("only the recipient can accept", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    const req = await request(a, b);
    await expect(rpc(a, "public.respond_connection_request($1, true)", [req])).rejects.toThrow(/VYBE_REQUEST_NOT_FOUND/);
  });

  it("rate-limits requests to 20 a day", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    await db.query(
      `insert into public.connection_requests (sender_id, recipient_id, kind, status)
       select $1, $2, 'friendship', 'withdrawn' from generate_series(1, 20)`,
      [a, b],
    );
    await expect(request(a, b)).rejects.toThrow(/VYBE_RATE_LIMITED/);
  });
});

describe("messaging permissions", () => {
  it("members of an active match can message; nobody else can read or write", async () => {
    const { a, b, conv } = await connected();
    const outsider = await makeMember(db);
    await send(a, conv, "Hi! Coastal drive this weekend?");
    await send(b, conv, "Absolutely");
    const read = await as(db, "authenticated", b, async (tx) =>
      (await tx.query<{ body: string }>("select body from public.messages where conversation_id = $1 order by created_at", [conv])).rows,
    );
    expect(read.map((m) => m.body)).toEqual(["Hi! Coastal drive this weekend?", "Absolutely"]);
    const outsiderRead = await as(db, "authenticated", outsider, async (tx) =>
      (await tx.query("select * from public.messages where conversation_id = $1", [conv])).rows,
    );
    expect(outsiderRead).toHaveLength(0);
    await expect(send(outsider, conv, "hey")).rejects.toThrow(/row-level security/);
  });

  it("there is no way to message without a match", async () => {
    const a = await makeMember(db);
    const b = await makeMember(db);
    await request(a, b);
    const convs = await as(db, "authenticated", a, async (tx) => (await tx.query("select * from public.conversations")).rows);
    expect(convs).toHaveLength(0);
  });

  it("members can't impersonate the other sender", async () => {
    const { a, b, conv } = await connected();
    await expect(
      as(db, "authenticated", a, (tx) =>
        tx.query("insert into public.messages (conversation_id, sender_id, body) values ($1, $2, 'fake')", [conv, b]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("unmatching ends messaging", async () => {
    const { a, b, conv } = await connected();
    await rpc(a, "public.unmatch($1)", [conv]);
    await expect(send(b, conv, "still there?")).rejects.toThrow(/row-level security/);
  });

  it("blocking ends the match, stops messages and removes the connection", async () => {
    const { a, b, conv } = await connected();
    await rpc(b, "public.block_user($1)", [a]);
    await expect(send(a, conv, "hello?")).rejects.toThrow(/row-level security/);
    const list = await as(db, "authenticated", a, async (tx) => (await tx.query("select * from public.my_connections()")).rows);
    expect(list).toHaveLength(0);
  });

  it("suspension stops messaging", async () => {
    const { a, b, conv } = await connected();
    await db.query("update public.profiles set account_status = 'suspended' where id = $1", [a]);
    await expect(send(b, conv, "hi")).rejects.toThrow(/row-level security/);
  });

  it("rate-limits message bursts", async () => {
    const { a, conv } = await connected();
    for (let i = 0; i < 30; i++) await send(a, conv, `m${i}`);
    await expect(send(a, conv, "one too many")).rejects.toThrow(/VYBE_RATE_LIMITED/);
  });

  it("my_connections shows unread counts and conversation previews", async () => {
    const { a, b, conv } = await connected();
    await send(a, conv, "First");
    await send(a, conv, "Second");
    const rows = await as(db, "authenticated", b, async (tx) =>
      (await tx.query<{ kind: string; unread: number; last_message: string }>("select * from public.my_connections() where kind = 'match'")).rows,
    );
    expect(rows[0]).toMatchObject({ unread: 2, last_message: "Second" });
  });
});

describe("reporting", () => {
  it("snapshots a reported message so evidence survives", async () => {
    const { a, b, conv } = await connected();
    await send(a, conv, "something abusive");
    const { rows } = await db.query<{ id: string }>("select id from public.messages where conversation_id = $1", [conv]);
    await rpc(b, "public.report_content('message', $1, 'harassment', 'not ok')", [rows[0].id]);
    const { rows: reports } = await db.query<{ target_user_id: string; snapshot: { body: string } }>(
      "select target_user_id, snapshot from public.reports where target_id = $1",
      [rows[0].id],
    );
    expect(reports[0]).toMatchObject({ target_user_id: a, snapshot: { body: "something abusive" } });
  });

  it("can't report messages from conversations you're not in", async () => {
    const { a, conv } = await connected();
    const outsider = await makeMember(db);
    await send(a, conv, "private");
    const { rows } = await db.query<{ id: string }>("select id from public.messages where conversation_id = $1", [conv]);
    await expect(rpc(outsider, "public.report_content('message', $1, 'spam_or_scam')", [rows[0].id])).rejects.toThrow(/VYBE_INVALID_TARGET/);
  });

  it("reports aren't readable by members", async () => {
    const a = await makeMember(db);
    const rows = await as(db, "authenticated", a, async (tx) => (await tx.query("select * from public.reports").catch(() => ({ rows: ["denied"] }))).rows);
    expect(rows).toEqual(["denied"]);
  });
});
