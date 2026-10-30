import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("landing page presents VYBE and leads to sign-up", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find someone on your wavelength");
    await page.getByRole("link", { name: /create your vybe/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: "Create your VYBE" })).toBeVisible();
  });

  test("every footer link resolves to a real page", async ({ page }) => {
    const pages = { About: "/about", "How it works": "/how-it-works", Safety: "/safety", Privacy: "/privacy", Terms: "/terms" };
    for (const [name, path] of Object.entries(pages)) {
      await page.goto("/");
      await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("Lost in space")).toHaveCount(0);
    }
  });

  test("sends security headers", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  });

  test("no horizontal scroll on the landing page", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("auth guards and validation", () => {
  test("protected routes redirect signed-out visitors to log in", async ({ page }) => {
    for (const path of ["/onboarding", "/onboarding/languages", "/universe"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/\//g, "%2F")}`));
    }
  });

  test("sign-up rejects under-18s and missing consent before reaching Supabase", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByLabel("Password").fill("Wavelength2026");
    const year = new Date().getFullYear() - 16;
    await page.getByLabel("Date of birth").fill(`${year}-06-15`);
    await page.getByRole("button", { name: "Create my VYBE" }).click();

    await expect(page.getByText("VYBE is for adults aged 18 and over.")).toBeVisible();
    await expect(page.getByText("Please confirm you are 18 or older.")).toBeVisible();
    await expect(page.getByText("Please accept the Terms and Privacy Policy.")).toBeVisible();
    await expect(page.getByLabel("Date of birth")).toHaveAttribute("aria-invalid", "true");
  });

  test("weak passwords are explained", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create my VYBE" }).click();
    await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
  });

  test("an expired email link shows a helpful message", async ({ page }) => {
    await page.goto("/login?error=link");
    await expect(page.getByRole("alert").filter({ hasText: "invalid or has expired" })).toBeVisible();
  });

  test("login can switch to a magic link", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Use a sign-in link instead" }).click();
    await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
  });
});
