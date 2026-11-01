// Renders a terminal-style transcript (real request/response text) and screenshots it
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function terminalShot(browser, file, title, lines) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: 2 });
  const body = lines
    .map((l) => {
      const t = esc(l);
      if (l.startsWith("$ ")) return `<span class="cmd">${t}</span>`;
      if (/^HTTP\/1\.1 [45]/.test(l)) return `<span class="bad">${t}</span>`;
      if (/^HTTP\/1\.1 2/.test(l)) return `<span class="ok">${t}</span>`;
      if (l.startsWith("#")) return `<span class="note">${t}</span>`;
      return t;
    })
    .join("\n");
  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;background:#e9e9ef;font-family:Menlo,Consolas,monospace}
    .win{margin:16px;border-radius:10px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.25)}
    .bar{background:#2d2f3a;color:#c8cad6;padding:8px 14px;font:13px system-ui}
    .bar i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:6px}
    pre{margin:0;background:#16171f;color:#e6e6ec;padding:16px 18px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-break:break-all}
    .cmd{color:#8be9fd}.ok{color:#50fa7b}.bad{color:#ff6e6e}.note{color:#9a9cb0}
  </style></head><body><div class="win" id="win"><div class="bar"><i style="background:#ff5f56"></i><i style="background:#ffbd2e"></i><i style="background:#27c93f"></i>&nbsp; ${esc(title)}</div><pre>${body}</pre></div></body></html>`);
  await page.locator("#win").screenshot({ path: file });
  await page.close();
}

// Pretty-prints a fetch Response like `curl -i`
export async function curlLike(res, { headers = [], maxBody = 600 } = {}) {
  const out = [`HTTP/1.1 ${res.status} ${res.statusText}`];
  for (const h of headers) {
    const v = h === "set-cookie" ? res.headers.getSetCookie?.().join("\n            ") : res.headers.get(h);
    if (v) out.push(`${h}: ${v}`);
  }
  const text = await res.text();
  out.push("", text.length > maxBody ? text.slice(0, maxBody) + " …" : text);
  return out;
}
