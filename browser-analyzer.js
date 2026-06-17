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

const repoInput = document.getElementById("repoInput");
const analyzeButton = document.getElementById("analyzeButton");
const copyCommandButton = document.getElementById("copyCommandButton");
const statusText = document.getElementById("statusText");
const summary = document.getElementById("summary");
const findingsBox = document.getElementById("findings");

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
    statusText.textContent = error instanceof Error ? error.message : "GitHub API unavailable. Trying public CDN fallback.";
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

async function analyzeRepo() {
  analyzeButton.disabled = true;
  summary.innerHTML = "";
  findingsBox.innerHTML = "";
  try {
    const { owner, repo } = parseRepo(repoInput.value);
    statusText.textContent = `Reading ${owner}/${repo} file list.`;
    const { branch, source, candidates } = await getCandidates(owner, repo);
    const files = [];
    let skipped = 0;
    for (let index = 0; index < candidates.length; index += 1) {
      const item = candidates[index];
      statusText.textContent = `Reading ${index + 1}/${candidates.length} from ${source}: ${item.path}`;
      const text = await fetchFileText(owner, repo, item);
      if (typeof text === "string") files.push({ path: item.path, text });
      else skipped += 1;
    }
    const findings = files.flatMap(scanFile).slice(0, 200);
    const high = findings.filter((item) => item.severity === "high").length;
    const medium = findings.filter((item) => item.severity === "medium").length;
    const low = findings.filter((item) => item.severity === "low").length;
    const score = Math.max(0, 100 - high * weights.high - medium * weights.medium - low * weights.low);
    statusText.textContent = `Complete. Scanned ${files.length} files from ${owner}/${repo} (${source}, ${branch}). Skipped ${skipped}.`;
    summary.innerHTML = `<div class="split"><div class="panel tight"><h2>Score ${score}/100</h2><p>${findings.length} findings. High ${high}, medium ${medium}, low ${low}.</p></div><div class="panel tight"><h2>Files ${files.length}</h2><p>Browser mode scanned public raw files under ${maxBytes} bytes. It falls back to jsDelivr when GitHub API is rate limited. Use the CLI for local, private, or very large repos.</p></div></div>`;
    findingsBox.innerHTML = findings.length ? findings.map((item) => `<div class="result"><strong>${escapeHtml(item.severity.toUpperCase())} · ${escapeHtml(item.label)}</strong><br><code>${escapeHtml(item.file)}:${item.line}</code><br><span>${escapeHtml(item.matchedText)}</span><p>${escapeHtml(item.reason)} ${escapeHtml(item.fix)}</p></div>`).join("") : `<div class="result"><strong>No findings from browser rules.</strong><p>Use the CLI for the full local pass.</p></div>`;
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "The browser audit stopped before completion.";
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
  statusText.textContent = "CLI command copied.";
}

analyzeButton.addEventListener("click", analyzeRepo);
copyCommandButton.addEventListener("click", () => copyCommand().catch((error) => { statusText.textContent = error instanceof Error ? error.message : "Copy did not complete."; }));
