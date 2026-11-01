// Checks the DEPLOYED site and captures screenshots for the record.
//   SITE=https://... API=https://... LABEL=before|after node live-check.mjs
import { chromium, firefox, webkit } from "playwright";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { terminalShot, curlLike } from "./term.mjs";

const SITE = process.env.SITE.replace(/\/$/, "");
const API = (process.env.API || "").replace(/\/$/, "");
const LABEL = process.env.LABEL || "after";
const FULL = process.env.FULL === "true";
const REPO = process.env.GITHUB_REPOSITORY || "mrinalbiju/techfest-2026";
const OUT = `${process.env.GITHUB_WORKSPACE || "."}/evidence/live`;
mkdirSync(OUT, { recursive: true });
const summary = { site: SITE, api: API, label: LABEL, checkedAt: new Date().toISOString() };

const chrome = await chromium.launch();

// ---------- Lighthouse report screenshots (reports produced by the workflow) ----------
for (const form of ["mobile", "desktop"]) {
  const f = `${process.env.GITHUB_WORKSPACE || "."}/evidence/lighthouse/${LABEL}-${form}.report.html`;
  if (!existsSync(f)) continue;
  const p = await chrome.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1.5 });
  await p.goto("file://" + f);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/../lighthouse/${LABEL}-${form}.png` });
  const json = JSON.parse(readFileSync(f.replace(".report.html", ".report.json"), "utf8"));
  summary[`lighthouse_${form}`] = Object.fromEntries(Object.entries(json.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  summary[`lighthouse_${form}_metrics`] = {
    FCP: json.audits["first-contentful-paint"].displayValue,
    LCP: json.audits["largest-contentful-paint"].displayValue,
    TBT: json.audits["total-blocking-time"].displayValue,
    CLS: json.audits["cumulative-layout-shift"].displayValue,
    SpeedIndex: json.audits["speed-index"].displayValue,
    totalBytes: json.audits["total-byte-weight"].displayValue,
  };
  summary[`lighthouse_${form}_failed`] = Object.values(json.audits)
    .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "notApplicable")
    .map((a) => `${a.title}${a.displayValue ? " (" + a.displayValue + ")" : ""}`);
  await p.close();
}

if (FULL) {
  // ---------- HTTPS + security headers of the live site and API ----------
  const siteRes = await fetch(SITE + "/");
  await terminalShot(chrome, `${OUT}/headers-frontend.png`, "Live frontend response headers (Vercel)", [
    `$ curl -I ${SITE}/`,
    ...(await curlLike(siteRes, { headers: ["content-type", "content-security-policy", "strict-transport-security", "x-frame-options", "x-content-type-options", "referrer-policy"], maxBody: 0 })).slice(0, -1),
  ]);
  const apiRes = await fetch(API + "/api/health");
  await terminalShot(chrome, `${OUT}/headers-api.png`, "Live API response headers (Render)", [
    `$ curl -i ${API}/api/health`,
    ...(await curlLike(apiRes, { headers: ["content-type", "content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "ratelimit-policy"] })),
  ]);
  const inj = await fetch(SITE + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: { $ne: null }, password: "x" }) });
  await terminalShot(chrome, `${OUT}/injection-live.png`, "Injection attempt against the live API", [
    `$ curl -i -X POST ${SITE}/api/auth/login -H "Content-Type: application/json" -d '{"email":{"$ne":null},"password":"x"}'`,
    ...(await curlLike(inj, { headers: ["content-type"], maxBody: 140 })),
  ]);

  // ---------- Pages: desktop + mobile, light + dark ----------
  const routes = [["/", "home"], ["/events", "events"], ["/gallery", "gallery"], ["/contact", "contact"], ["/register", "register"], ["/login", "login"], ["/cart", "cart"], ["/no-such-page", "404"]];
  for (const [vw, vh, tag] of [[1366, 860, "desktop"], [390, 844, "mobile"]]) {
    const ctx = await chrome.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: tag === "mobile" ? 2 : 1 });
    const p = await ctx.newPage();
    for (const [path, name] of routes) {
      await p.goto(SITE + path, { waitUntil: "networkidle" });
      await p.waitForTimeout(800);
      await p.screenshot({ path: `${OUT}/page-${name}-${tag}.png`, fullPage: tag === "desktop" && name !== "gallery" });
    }
    await p.goto(SITE + "/events", { waitUntil: "networkidle" });
    await p.click(".theme-btn").catch(async () => { await p.click(".menu-btn"); await p.click(".theme-btn"); });
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/page-events-dark-${tag}.png` });
    await ctx.close();
  }

  // ---------- Full workflow on the live site: sign up -> log in -> register -> my registrations ----------
  const ctx = await chrome.newContext({ viewport: { width: 1366, height: 860 } });
  const p = await ctx.newPage();
  const email = `record.demo.${Date.now()}@example.com`;
  await p.goto(SITE + "/register", { waitUntil: "networkidle" });
  await p.fill('input[name="name"]', "Record Demo");
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="password"]', "Demo12345");
  await p.fill('input[name="confirm"]', "Demo12345");
  await p.click("form button");
  await p.waitForSelector(".notice, .error", { timeout: 60000 });
  await p.screenshot({ path: `${OUT}/flow-1-signup.png` });
  await p.goto(SITE + "/login");
  await p.fill('input[type="email"]', email);
  await p.fill('input[type="password"]', "Demo12345");
  const [loginRes] = await Promise.all([p.waitForResponse((r) => r.url().includes("/api/auth/login")), p.click("form button")]);
  summary.liveLoginStatus = loginRes.status();
  summary.liveSetCookie = (await loginRes.allHeaders())["set-cookie"];
  await p.waitForURL(/events/, { timeout: 30000 });
  await p.waitForSelector(".event-card");
  const card = p.locator(".event-card", { hasText: "Web Dev Bootcamp" });
  const seatsBefore = await card.locator(".seats").textContent();
  await card.locator("button.btn").click();
  await p.waitForSelector(".notice", { timeout: 30000 });
  await p.waitForTimeout(800);
  summary.seats = { before: seatsBefore, after: await card.locator(".seats").textContent() };
  await p.screenshot({ path: `${OUT}/flow-2-registered.png` });
  await p.goto(SITE + "/my-registrations", { waitUntil: "networkidle" });
  await p.waitForSelector("table, .empty", { timeout: 30000 });
  await p.screenshot({ path: `${OUT}/flow-3-my-registrations.png` });
  summary.readableByJs = await p.evaluate(() => ({ cookie: document.cookie, localStorageToken: localStorage.getItem("token") }));
  // Deep link refresh works (SPA rewrite)
  const deep = await p.goto(SITE + "/events");
  summary.deepLinkStatus = deep.status();
  await ctx.close();
  await terminalShot(chrome, `${OUT}/cookie-live.png`, "Live login: token cookie flags", [
    `# POST ${SITE}/api/auth/login  (HTTPS, proxied by Vercel to Render)`,
    `HTTP/1.1 ${summary.liveLoginStatus}`,
    `set-cookie: ${summary.liveSetCookie}`,
    "",
    "# Readable from page JavaScript after login:",
    `> document.cookie            → "${summary.readableByJs.cookie}"`,
    `> localStorage.getItem("token") → ${summary.readableByJs.localStorageToken}`,
  ]);

  // ---------- Cross-browser / cross-device check ----------
  const matrix = [];
  for (const [name, type] of [["Chromium", chromium], ["Firefox", firefox], ["WebKit (Safari)", webkit]]) {
    const b = name === "Chromium" ? chrome : await type.launch();
    for (const [w, h, device] of [[390, 844, "Mobile 390px"], [768, 1024, "Tablet 768px"], [1366, 860, "Desktop 1366px"]]) {
      const c = await b.newContext({ viewport: { width: w, height: h } });
      const pg = await c.newPage();
      const errors = [];
      pg.on("pageerror", (e) => errors.push(e.message));
      await pg.goto(SITE + "/events", { waitUntil: "networkidle" });
      await pg.waitForSelector(".event-card", { timeout: 60000 });
      const r = await pg.evaluate(() => ({ overflow: document.documentElement.scrollWidth > window.innerWidth + 1, cards: document.querySelectorAll(".event-card").length }));
      await pg.goto(SITE + "/gallery", { waitUntil: "networkidle" });
      const imgsOk = await pg.evaluate(() => [...document.images].every((i) => i.complete));
      matrix.push({ browser: name, device, eventsLoaded: r.cards, horizontalScroll: r.overflow, imagesOk: imgsOk, jsErrors: errors.length });
      if (device !== "Tablet 768px") {
        await pg.goto(SITE + "/", { waitUntil: "networkidle" });
        await pg.screenshot({ path: `${OUT}/xb-${name.split(" ")[0].toLowerCase()}-${w}.png` });
      }
      await c.close();
    }
    if (name !== "Chromium") await b.close();
  }
  summary.crossBrowser = matrix;

  // ---------- GitHub evidence ----------
  const gh = await chrome.newPage({ viewport: { width: 1280, height: 900 } });
  for (const [path, name, full] of [["/actions/workflows/ci.yml", "gh-actions", true], ["/commits/main", "gh-commits", false], ["/branches/all", "gh-branches", false]]) {
    try {
      await gh.goto(`https://github.com/${REPO}${path}`, { waitUntil: "networkidle", timeout: 45000 });
      await gh.waitForTimeout(1500);
      await gh.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
    } catch (e) {
      summary[`${name}_error`] = e.message;
    }
  }
}

writeFileSync(`${OUT}/summary-${LABEL}.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await chrome.close();
