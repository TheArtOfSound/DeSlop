// deslop:ignore-file -- browser rule catalog intentionally contains phrases the scanner is supposed to catch.
const supportedExtensions = new Set([".md", ".mdx", ".txt", ".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css"]);
const maxFiles = 80;
const maxBytes = 250000;
const weights = { high: 8, medium: 4, low: 1 };
const ignoreFileMarker = "deslop:ignore-file";
const ignoreLineMarker = "deslop:ignore-line";
const fallbackBranches = ["main", "master", "gh-pages"];

const authStoragePattern = /\b(localStorage|sessionStorage)\.(getItem|setItem)\s*\(\s*["'`](?:[a-z0-9]+[-_])*(?:token|auth|jwt|session|user|role|password|apikey|api_key|api-key|secret)(?:[-_][a-z0-9]+)*["'`]/gi;
const ruleData = [
  ["fake-production-claim", "Fake maturity claim", "high", "release-hygiene", ["production" + "-ready", "enterprise" + "-grade", "battle" + "-tested", "world" + "-class"], "Large maturity claims need proof.", "Name the guarantee the system actually enforces."],
  ["generic-saas-filler", "Generic product filler", "medium", "copy", ["streamline" + " your workflow", "unlock" + " your potential", "seamless" + " experience", "robust" + " solution", "all-in-one" + " platform", "built for" + " modern teams"], "The phrase could describe almost any app.", "Use actor, action, object, and consequence."],
  ["weak-error-message", "Weak error message", "medium", "ux", ["something" + " went wrong", "an error" + " occurred", "please try" + " again later", "unable to" + " complete request"], "The user gets no cause, consequence, or next step.", "Say what failed, why it matters, and what the user can do next."],
  ["dead-navigation-target", "Dead navigation target", "medium", "implementation", ["href=\"#\"", "href='" + "#'", "javascript:void(0)", "to=\"" + "#\""], "A visible navigation element points nowhere.", "Remove it, wire it, or show a disabled state with a concrete reason."],
  ["debug-log-leftover", "Debug output", "low", "release-hygiene", ["console." + "log(", "console." + "debug(", "console." + "trace("], "Loose debug output makes shipped behavior harder to inspect.", "Use a named logger with levels, or remove the output before release."],
  ["client-only-auth-storage", "Client-only auth storage", "high", "security", [authStoragePattern], "Auth-like state stored in browser storage is easy to spoof and usually means permissions are not enforced server-side.", "Move permission enforcement to the server and treat browser state as display-only."],
  ["unfinished-branch", "Unfinished branch", "high", "implementation", ["not" + " implemented", "throw new Error(\"" + "stub\"", "throw new Error('" + "stub'"], "The code can reach a branch that admits the product is unfinished.", "Implement the branch, remove the route, or fail earlier with a precise constraint."]
];

const categoryLabels = { copy: "copy", ux: "ux", implementation: "impl", security: "security", "release-hygiene": "hygiene" };

const repoInput = document.getElementById("repoInput");
const analyzeButton = document.getElementById("analyzeButton");
const copyCommandButton = document.getElementById("copyCommandButton");
const statusText = document.getElementById("statusText");
const summary = document.getElementById("summary");
const controls = document.getElementById("controls");
const findingsBox = document.getElementById("findings");

let lastResult = null;
let activeFilter = "all";

function setStatus(message) {
  statusText.innerHTML = `<span class="dot"></span>${escapeHtml(message)}`;
}

function parseRepo(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^https:\/\/github\.com\/([^\/\s]+)\/([^\/\s#?]+)(?:\/.*)?$/i) || trimmed.match(/^([^\/\s]+)\/([^\/\s]+)$/);
  if (!match) throw new Error("Enter a GitHub repo URL such as https://github.com/owner/repo.");
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

function extensionOf(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function lineText(text, index) {
  const start = text.lastIndexOf("\n", index) + 1;
  const end = text.indexOf("\n", index);
  return text.slice(start, end === -1 ? text.length : end);
}

function shouldSuppressFinding(path, id, text, index) {
  if (lineText(text, index).includes(ignoreLineMarker)) return true;
  if (id !== "debug-log-leftover") return false;
  const normalized = path.toLowerCase();
  if (normalized.endsWith(".md") || normalized.endsWith(".mdx")) return true;
  if (normalized.endsWith(".html") && isInsideHtmlCodeExample(text, index)) return true;
  return false;
}

function isInsideHtmlCodeExample(text, index) {
  const before = text.slice(0, index).toLowerCase();
  const lastPreOpen = before.lastIndexOf("<pre");
  const lastPreClose = before.lastIndexOf("</pre>");
  const lastCodeOpen = before.lastIndexOf("<code");
  const lastCodeClose = before.lastIndexOf("</code>");
  return lastPreOpen > lastPreClose || lastCodeOpen > lastCodeClose;
}

function scanFile(file) {
  if (file.text.includes(ignoreFileMarker)) return [];
  const findings = [];
  for (const [id, label, severity, category, terms, reason, fix] of ruleData) {
    const lower = file.text.toLowerCase();
    for (const term of terms) {
      if (term instanceof RegExp) {
        term.lastIndex = 0;
        for (const match of file.text.matchAll(term)) {
          if (match.index === undefined) continue;
          if (shouldSuppressFinding(file.path, id, file.text, match.index)) continue;
          findings.push({ id, label, severity, category, file: file.path, line: lineNumber(file.text, match.index), matchedText: match[0], reason, fix });
        }
        continue;
      }
      const needle = term.toLowerCase();
      let position = lower.indexOf(needle);
      while (position !== -1) {
        if (!shouldSuppressFinding(file.path, id, file.text, position)) {
          findings.push({ id, label, severity, category, file: file.path, line: lineNumber(file.text, position), matchedText: file.text.slice(position, position + term.length), reason, fix });
        }
        position = lower.indexOf(needle, position + needle.length);
      }
    }
  }
  return findings;
}

async function fetchJson(url, options = {}) {
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${separator}deslop_cache_bust=${Date.now()}`, { cache: "no-store" });
  if (response.status === 403) throw new Error(options.rateLimitMessage || "GitHub API rate limited this browser request.");
  if (!response.ok) throw new Error(`GitHub API returned ${response.status} for ${url}`);
  return response.json();
}

async function fetchText(url) {
  const separator = url.includes("?") ? "&" : "?";
  const cacheBustedUrl = `${url}${separator}deslop_cache_bust=${Date.now()}`;
  const response = await fetch(cacheBustedUrl, { cache: "no-store" });
  if (!response.ok) return null;
  return response.text();
}

async function getGitHubCandidates(owner, repo) {
  const meta = await fetchJson(`https://api.github.com/repos/${owner}/${repo}`, {
    rateLimitMessage: "GitHub API rate limited metadata. Trying public CDN fallback."
  });
  const branch = meta.default_branch;
  const tree = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
    rateLimitMessage: "GitHub API rate limited file tree. Trying public CDN fallback."
  });
  const candidates = tree.tree
    .filter((item) => item.type === "blob" && supportedExtensions.has(extensionOf(item.path)) && item.size <= maxBytes)
    .slice(0, maxFiles)
    .map((item) => ({ path: item.path, size: item.size, source: "github", branch }));
  return { branch, source: "GitHub API", candidates };
}

async function getCdnCandidates(owner, repo) {
  let lastStatus = "";
  for (const branch of fallbackBranches) {
    const url = `https://data.jsdelivr.com/v1/package/gh/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}@${encodeURIComponent(branch)}/flat`;
    const response = await fetch(`${url}?deslop_cache_bust=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      lastStatus = `${response.status} for ${branch}`;
      continue;
    }
    const payload = await response.json();
    const files = Array.isArray(payload.files) ? payload.files : [];
    const candidates = files
      .map((file) => ({ path: String(file.name || "").replace(/^\//, ""), size: Number(file.size || 0), source: "cdn", branch }))
      .filter((item) => item.path && supportedExtensions.has(extensionOf(item.path)) && item.size <= maxBytes)
      .slice(0, maxFiles);
    if (candidates.length) return { branch, source: "jsDelivr CDN", candidates };
    lastStatus = `no supported files for ${branch}`;
  }
  throw new Error(`Browser fallback could not list this repo through jsDelivr (${lastStatus}). Use Copy CLI command.`);
}

async function getCandidates(owner, repo) {
  try {
    return await getGitHubCandidates(owner, repo);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "GitHub API unavailable. Trying public CDN fallback.");
    return getCdnCandidates(owner, repo);
  }
}

async function fetchFileText(owner, repo, item) {
  const encodedPath = item.path.split("/").map(encodeURIComponent).join("/");
  if (item.source === "cdn") {
    return fetchText(`https://cdn.jsdelivr.net/gh/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}@${encodeURIComponent(item.branch)}/${encodedPath}`);
  }
  return fetchText(`https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(item.branch)}/${encodedPath}`);
}

function verdictFor(score) {
  if (score >= 90) return "clean pass";
  if (score >= 70) return "review";
  if (score >= 40) return "pressure";
  return "heavy slop";
}

function severityColor(score) {
  if (score >= 90) return "var(--accent)";
  if (score >= 70) return "var(--med)";
  return "var(--high)";
}

function animateScore(target) {
  const numEl = document.getElementById("scoreNum");
  const fillEl = document.getElementById("scoreFill");
  if (!numEl || !fillEl) return;
  const color = severityColor(target);
  numEl.style.color = color;
  const start = performance.now();
  const duration = 900;
  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    numEl.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(step);
    else numEl.textContent = String(target);
  }
  requestAnimationFrame(step);
  requestAnimationFrame(() => { fillEl.style.width = `${target}%`; fillEl.style.background = color; });
}

function renderSummary(result) {
  const { score, high, medium, low, findings, files, source, branch, owner, repo } = result;
  summary.innerHTML = `
    <div class="summary">
      <div class="cell">
        <div class="scoreline">
          <span class="score-num mono" id="scoreNum">0</span>
          <span class="score-den">/100</span>
          <span class="score-verdict" style="color:${severityColor(score)};border-color:${severityColor(score)};">${escapeHtml(verdictFor(score))}</span>
        </div>
        <div class="track"><div class="fill" id="scoreFill"></div></div>
        <div class="sev-row">
          <span class="sev-high"><b>${high}</b>high &minus;8</span>
          <span class="sev-med"><b>${medium}</b>medium &minus;4</span>
          <span class="sev-low"><b>${low}</b>low &minus;1</span>
        </div>
      </div>
      <div class="cell">
        <div class="meta-list">
          <div class="meta-row"><span class="k">repository</span><span class="v">${escapeHtml(owner)}/${escapeHtml(repo)}</span></div>
          <div class="meta-row"><span class="k">files scanned</span><span class="v">${files}</span></div>
          <div class="meta-row"><span class="k">findings</span><span class="v">${findings.length}</span></div>
          <div class="meta-row"><span class="k">source</span><span class="v">${escapeHtml(source)} &middot; ${escapeHtml(branch)}</span></div>
        </div>
      </div>
    </div>`;
  animateScore(score);
}

function renderControls(result) {
  if (!result.findings.length) { controls.innerHTML = ""; return; }
  const counts = { all: result.findings.length, high: result.high, medium: result.medium, low: result.low };
  const sevChips = ["all", "high", "medium", "low"]
    .filter((key) => key === "all" || counts[key] > 0)
    .map((key) => chip(key, key === "all" ? "all" : key, counts[key]))
    .join("");
  const catCounts = {};
  for (const f of result.findings) catCounts[f.category] = (catCounts[f.category] || 0) + 1;
  const catChips = Object.keys(catCounts)
    .sort()
    .map((cat) => chip(`cat:${cat}`, categoryLabels[cat] || cat, catCounts[cat]))
    .join("");
  controls.innerHTML = `
    <div class="controls">
      ${sevChips}<span style="width:1px;height:20px;background:var(--line-2);margin:0 4px;"></span>${catChips}
      <span class="spacer"></span>
      <button class="btn" id="copyMarkdownButton" type="button">Copy report &#8595; md</button>
      <button class="btn" id="copyBadgeButton" type="button">Copy summary</button>
    </div>`;
  controls.querySelectorAll(".chip").forEach((el) => {
    el.addEventListener("click", () => { activeFilter = el.dataset.filter; renderFindings(result); updateChipState(); });
  });
  document.getElementById("copyMarkdownButton").addEventListener("click", () => copyMarkdown(result).catch(() => setStatus("Copy did not complete. Select the report manually.")));
  document.getElementById("copyBadgeButton").addEventListener("click", () => copyBadge(result).catch(() => setStatus("Copy did not complete. Select the summary manually.")));
  updateChipState();
}

function chip(filter, label, count) {
  return `<span class="chip" data-filter="${escapeHtml(filter)}">${escapeHtml(label)}<span class="n">${count}</span></span>`;
}

function updateChipState() {
  controls.querySelectorAll(".chip").forEach((el) => {
    el.classList.toggle("active", el.dataset.filter === activeFilter);
  });
}

function filteredFindings(result) {
  if (activeFilter === "all") return result.findings;
  if (activeFilter.startsWith("cat:")) {
    const cat = activeFilter.slice(4);
    return result.findings.filter((f) => f.category === cat);
  }
  return result.findings.filter((f) => f.severity === activeFilter);
}

function renderFindings(result) {
  if (!result.findings.length) {
    findingsBox.innerHTML = `<div class="empty"><div class="big">&#10003; No findings from the browser rules.</div><p>This pass did not match configured slop patterns. Run the CLI for the deeper local rule set.</p></div>`;
    return;
  }
  const items = filteredFindings(result);
  if (!items.length) {
    findingsBox.innerHTML = `<div class="empty"><p>No findings in this filter.</p></div>`;
    return;
  }
  findingsBox.innerHTML = items.map((item, index) => `
    <div class="finding sev-${item.severity}" style="animation-delay:${Math.min(index * 35, 420)}ms">
      <div class="ftop">
        <span class="badge ${item.severity}">${escapeHtml(item.severity)}</span>
        <span class="label">${escapeHtml(item.label)}</span>
        <span class="cat">${escapeHtml(categoryLabels[item.category] || item.category)}</span>
      </div>
      <div class="loc">${escapeHtml(item.file)}:${item.line}</div>
      <code class="matched">${escapeHtml(item.matchedText)}</code>
      <p class="why">${escapeHtml(item.reason)} <span class="fix"><b>Fix:</b> ${escapeHtml(item.fix)}</span></p>
    </div>`).join("");
}

function buildMarkdown(result) {
  const lines = [
    `# DeSlop report - ${result.owner}/${result.repo}`,
    "",
    `Score: ${result.score}/100 (${verdictFor(result.score)})`,
    `Files scanned: ${result.files} from ${result.source} (${result.branch})`,
    `Findings: ${result.findings.length} - ${result.high} high, ${result.medium} medium, ${result.low} low`,
    ""
  ];
  if (!result.findings.length) {
    lines.push("No findings from the browser rules.");
  } else {
    for (const f of result.findings) {
      lines.push(`- [${f.severity.toUpperCase()}] ${f.label} - \`${f.file}:${f.line}\``);
      lines.push(`  - match: \`${f.matchedText}\``);
      lines.push(`  - why: ${f.reason}`);
      lines.push(`  - fix: ${f.fix}`);
    }
  }
  lines.push("", "Scanned with DeSlop - https://deslop.imagineqira.com/");
  return lines.join("\n");
}

async function copyMarkdown(result) {
  await navigator.clipboard.writeText(buildMarkdown(result));
  setStatus("Report copied as Markdown.");
}

async function copyBadge(result) {
  const text = `DeSlop ${result.score}/100 - ${result.findings.length} findings (${result.high} high, ${result.medium} medium, ${result.low} low) on ${result.owner}/${result.repo} - https://deslop.imagineqira.com/`;
  await navigator.clipboard.writeText(text);
  setStatus("Result summary copied to clipboard.");
}

async function analyzeRepo() {
  analyzeButton.disabled = true;
  summary.innerHTML = "";
  controls.innerHTML = "";
  findingsBox.innerHTML = "";
  activeFilter = "all";
  try {
    const { owner, repo } = parseRepo(repoInput.value);
    setStatus(`Reading ${owner}/${repo} file list.`);
    const { branch, source, candidates } = await getCandidates(owner, repo);
    const files = [];
    let skipped = 0;
    for (let index = 0; index < candidates.length; index += 1) {
      const item = candidates[index];
      setStatus(`Reading ${index + 1}/${candidates.length} from ${source}: ${item.path}`);
      const text = await fetchFileText(owner, repo, item);
      if (typeof text === "string") files.push({ path: item.path, text });
      else skipped += 1;
    }
    const findings = files.flatMap(scanFile).slice(0, 200);
    findings.sort((a, b) => weights[b.severity] - weights[a.severity] || a.file.localeCompare(b.file) || a.line - b.line);
    const high = findings.filter((item) => item.severity === "high").length;
    const medium = findings.filter((item) => item.severity === "medium").length;
    const low = findings.filter((item) => item.severity === "low").length;
    const score = Math.max(0, 100 - high * weights.high - medium * weights.medium - low * weights.low);
    lastResult = { owner, repo, branch, source, files: files.length, findings, high, medium, low, score };
    setStatus(`Complete. Scanned ${files.length} files from ${owner}/${repo} (${source}, ${branch}). Skipped ${skipped}.`);
    renderSummary(lastResult);
    renderControls(lastResult);
    renderFindings(lastResult);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "The browser audit stopped before completion.");
  } finally {
    analyzeButton.disabled = false;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
}

async function copyCommand() {
  const { owner, repo } = parseRepo(repoInput.value);
  const command = `git clone https://github.com/${owner}/${repo}.git\ncd ${repo}\nnpx -y github:TheArtOfSound/DeSlop -- . --min-score 90`;
  await navigator.clipboard.writeText(command);
  setStatus("CLI command copied.");
}

analyzeButton.addEventListener("click", analyzeRepo);
copyCommandButton.addEventListener("click", () => copyCommand().catch((error) => { setStatus(error instanceof Error ? error.message : "Copy did not complete."); }));
repoInput.addEventListener("keydown", (event) => { if (event.key === "Enter") analyzeRepo(); });
