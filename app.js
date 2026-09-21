const APPS = [
  {name:"Google Chrome", slug:"googlechrome", category:"Browsers", desc:"Fast, familiar browsing with Google services.", winget:"Google.Chrome", brew:"google-chrome"},
  {name:"Mozilla Firefox", slug:"firefoxbrowser", category:"Browsers", desc:"Independent, privacy-focused open-source browser.", winget:"Mozilla.Firefox", brew:"firefox", flatpak:"org.mozilla.firefox"},
  {name:"Brave", slug:"brave", category:"Browsers", desc:"Privacy-first browser with built-in blocking.", winget:"Brave.Brave", brew:"brave-browser", flatpak:"com.brave.Browser"},
  {name:"Opera", slug:"opera", category:"Browsers", desc:"Feature-rich browser with workspace tools.", winget:"Opera.Opera", brew:"opera"},

  {name:"7-Zip", slug:"7zip", category:"Utilities", desc:"Compact, open-source file archiver.", winget:"7zip.7zip"},
  {name:"WinRAR", slug:"winrar", category:"Utilities", desc:"Classic archive manager for Windows.", winget:"RARLab.WinRAR"},
  {name:"Everything", slug:"voidlinux", category:"Utilities", desc:"Instant file-name search for Windows.", winget:"voidtools.Everything"},
  {name:"PowerToys", slug:"windows", category:"Utilities", desc:"Microsoft's advanced Windows utility suite.", winget:"Microsoft.PowerToys"},
  {name:"ShareX", slug:"sharex", category:"Utilities", desc:"Powerful screenshot and capture workflow.", winget:"ShareX.ShareX"},
  {name:"AnyDesk", slug:"anydesk", category:"Utilities", desc:"Lightweight remote desktop access.", winget:"AnyDeskSoftwareGmbH.AnyDesk", brew:"anydesk"},

  {name:"VLC", slug:"vlcmediaplayer", category:"Media", desc:"Plays almost any audio or video format.", winget:"VideoLAN.VLC", brew:"vlc", flatpak:"org.videolan.VLC"},
  {name:"Spotify", slug:"spotify", category:"Media", desc:"Music and podcast streaming.", winget:"Spotify.Spotify", brew:"spotify", flatpak:"com.spotify.Client"},
  {name:"Discord", slug:"discord", category:"Communication", desc:"Voice, video and community chat.", winget:"Discord.Discord", brew:"discord", flatpak:"com.discordapp.Discord"},
  {name:"Telegram", slug:"telegram", category:"Communication", desc:"Fast cloud messaging across devices.", winget:"Telegram.TelegramDesktop", brew:"telegram", flatpak:"org.telegram.desktop"},
  {name:"WhatsApp", slug:"whatsapp", category:"Communication", desc:"Desktop messaging and calls.", winget:"WhatsApp.WhatsApp", brew:"whatsapp"},
  {name:"Slack", slug:"slack", category:"Communication", desc:"Team messaging and collaboration.", winget:"SlackTechnologies.Slack", brew:"slack", flatpak:"com.slack.Slack"},
  {name:"Zoom", slug:"zoom", category:"Communication", desc:"Video meetings and screen sharing.", winget:"Zoom.Zoom", brew:"zoom", flatpak:"us.zoom.Zoom"},
  {name:"Microsoft Teams", slug:"microsoftteams", category:"Communication", desc:"Meetings, chat and Microsoft 365 teamwork.", winget:"Microsoft.Teams", brew:"microsoft-teams"},

  {name:"Visual Studio Code", slug:"visualstudiocode", category:"Developer", desc:"Extensible code editor from Microsoft.", winget:"Microsoft.VisualStudioCode", brew:"visual-studio-code", flatpak:"com.visualstudio.code"},
  {name:"Git", slug:"git", category:"Developer", desc:"Distributed version control, the essential CLI.", winget:"Git.Git", brew:"git"},
  {name:"GitHub Desktop", slug:"github", category:"Developer", desc:"Visual Git workflow for GitHub repositories.", winget:"GitHub.GitHubDesktop", brew:"github"},
  {name:"Docker Desktop", slug:"docker", category:"Developer", desc:"Containers, Compose and local development.", winget:"Docker.DockerDesktop", brew:"docker"},
  {name:"JetBrains Toolbox", slug:"jetbrains", category:"Developer", desc:"Manage JetBrains IDEs and updates.", winget:"JetBrains.Toolbox", brew:"jetbrains-toolbox"},
  {name:"Notepad++", slug:"notepadplusplus", category:"Developer", desc:"Fast Windows text and source editor.", winget:"Notepad++.Notepad++"},

  {name:"Obsidian", slug:"obsidian", category:"Productivity", desc:"Local-first notes connected by links.", winget:"Obsidian.Obsidian", brew:"obsidian", flatpak:"md.obsidian.Obsidian"},
  {name:"Notion", slug:"notion", category:"Productivity", desc:"Docs, projects, notes and collaborative workspace.", winget:"Notion.Notion", brew:"notion"},
  {name:"LibreOffice", slug:"libreoffice", category:"Productivity", desc:"Open-source office productivity suite.", winget:"TheDocumentFoundation.LibreOffice", brew:"libreoffice", flatpak:"org.libreoffice.LibreOffice"},

  {name:"Steam", slug:"steam", category:"Gaming", desc:"PC games library, store and community.", winget:"Valve.Steam", brew:"steam", flatpak:"com.valvesoftware.Steam"},
  {name:"Epic Games", slug:"epicgames", category:"Gaming", desc:"Epic Games Store desktop launcher.", winget:"EpicGames.EpicGamesLauncher"},
  {name:"GOG Galaxy", slug:"gogdotcom", category:"Gaming", desc:"DRM-free games library and launcher.", winget:"GOG.Galaxy"},
  {name:"EA app", slug:"ea", category:"Gaming", desc:"Electronic Arts game library and launcher.", winget:"ElectronicArts.EADesktop"},

  {name:"qBittorrent", slug:"qbittorrent", category:"Internet", desc:"Clean open-source BitTorrent client.", winget:"qBittorrent.qBittorrent", brew:"qbittorrent", flatpak:"org.qbittorrent.qBittorrent"}
];

const state = {
  platform: "windows",
  category: "All",
  search: "",
  selected: new Set()
};

const platformMeta = {
  windows: { label:"Windows", source:"Powered by winget", ext:"ps1", mime:"text/plain;charset=utf-8" },
  macos: { label:"macOS", source:"Powered by Homebrew", ext:"sh", mime:"text/x-shellscript;charset=utf-8" },
  linux: { label:"Linux", source:"Powered by Flatpak", ext:"sh", mime:"text/x-shellscript;charset=utf-8" }
};

const els = {
  catalog: document.querySelector("#catalog"),
  categoryTabs: document.querySelector("#categoryTabs"),
  search: document.querySelector("#searchInput"),
  empty: document.querySelector("#emptyState"),
  platformButtons: [...document.querySelectorAll(".platform-button")],
  platformNote: document.querySelector("#platformNote"),
  headerCount: document.querySelector("#headerCount"),
  headerSelection: document.querySelector("#headerSelection"),
  tray: document.querySelector("#forgeTray"),
  trayToggle: document.querySelector("#trayToggle"),
  trayCount: document.querySelector("#trayCount"),
  trayTitle: document.querySelector("#trayTitle"),
  traySubtitle: document.querySelector("#traySubtitle"),
  selectedChips: document.querySelector("#selectedChips"),
  clear: document.querySelector("#clearButton"),
  forge: document.querySelector("#forgeButton"),
  modal: document.querySelector("#modalBackdrop"),
  modalClose: document.querySelector("#modalClose"),
  modalPlatform: document.querySelector("#modalPlatform"),
  modalDescription: document.querySelector("#modalDescription"),
  preview: document.querySelector("#scriptPreview"),
  scriptName: document.querySelector("#scriptName"),
  copy: document.querySelector("#copyButton"),
  copyCommand: document.querySelector("#copyCommandButton"),
  download: document.querySelector("#downloadButton")
};

function packageId(app) {
  return state.platform === "windows" ? app.winget : state.platform === "macos" ? app.brew : app.flatpak;
}
function safeId(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g,""); }

function renderCategories() {
  const categories = ["All", ...new Set(APPS.map(app => app.category))];
  els.categoryTabs.innerHTML = categories.map(cat =>
    `<button class="category-button ${cat === state.category ? "active" : ""}" data-category="${cat}" type="button">${cat}</button>`
  ).join("");
  els.categoryTabs.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
    state.category = btn.dataset.category;
    renderCategories();
    renderCatalog();
  }));
}

function renderCatalog() {
  const q = state.search.trim().toLowerCase();
  const list = APPS.filter(app =>
    (state.category === "All" || app.category === state.category) &&
    (!q || (app.name + " " + app.category + " " + app.desc).toLowerCase().includes(q))
  );

  els.catalog.innerHTML = list.map(app => {
    const selected = state.selected.has(app.name);
    const available = Boolean(packageId(app));
    return `
      <article class="app-row ${selected ? "selected" : ""} ${available ? "" : "app-unavailable"}" data-app="${app.name}" tabindex="${available ? "0" : "-1"}" role="button" aria-pressed="${selected}" aria-disabled="${!available}">
        <div class="app-icon">
          <img src="https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/${app.slug}.svg" alt="" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=\'fallback\'>${app.name.charAt(0)}</span>')" />
        </div>
        <div class="app-main">
          <strong>${app.name}</strong>
          <small>${app.category}</small>
        </div>
        <div class="app-description">${app.desc}</div>
        <div>${available ? '<span class="app-action" aria-hidden="true">+</span>' : '<span class="unavailable-label">Not on this platform</span>'}</div>
      </article>`;
  }).join("");

  els.empty.hidden = list.length !== 0;
  els.catalog.querySelectorAll(".app-row:not(.app-unavailable)").forEach(row => {
    row.addEventListener("click", () => toggleApp(row.dataset.app));
    row.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleApp(row.dataset.app); }
    });
  });
}

function toggleApp(name) {
  if (state.selected.has(name)) state.selected.delete(name);
  else state.selected.add(name);
  renderCatalog();
  renderSelection();
}

function renderSelection() {
  const chosen = APPS.filter(app => state.selected.has(app.name) && packageId(app));
  const invalid = [...state.selected].filter(name => {
    const app = APPS.find(a => a.name === name);
    return app && !packageId(app);
  });
  invalid.forEach(name => state.selected.delete(name));

  const n = chosen.length;
  els.headerCount.textContent = n;
  els.trayCount.textContent = n;
  els.forge.disabled = n === 0;
  els.trayTitle.textContent = n ? `${n} app${n === 1 ? "" : "s"} on the anvil` : "Select your first app";
  els.traySubtitle.textContent = n ? `Ready for ${platformMeta[state.platform].label}` : "Your setup will appear here";
  els.selectedChips.innerHTML = chosen.map(app =>
    `<button class="selected-chip" data-remove="${app.name}" type="button">${app.name} ×</button>`
  ).join("");
  els.selectedChips.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => toggleApp(btn.dataset.remove)));
}

function setPlatform(platform) {
  state.platform = platform;
  document.documentElement.dataset.platform = platform;
  state.selected.clear();
  els.platformButtons.forEach(btn => {
    const active = btn.dataset.platform === platform;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  els.platformNote.textContent = platformMeta[platform].source;
  renderCatalog();
  renderSelection();
}

function generateScript() {
  const apps = APPS.filter(app => state.selected.has(app.name) && packageId(app));
  if (state.platform === "windows") {
    const lines = [
      "# Appanvil setup — generated locally in your browser",
      "# Review this file before running it.",
      "$ErrorActionPreference = 'Continue'",
      "",
      "Write-Host 'Appanvil: updating winget sources...' -ForegroundColor Cyan",
      "winget source update",
      ""
    ];
    apps.forEach(app => {
      lines.push(`Write-Host "Installing ${app.name}..." -ForegroundColor Green`);
      lines.push(`winget install --id "${app.winget}" -e --silent --accept-package-agreements --accept-source-agreements`);
      lines.push("");
    });
    lines.push("Write-Host 'Appanvil: setup complete.' -ForegroundColor Cyan");
    return lines.join("\n");
  }
  if (state.platform === "macos") {
    const casks = apps.map(app => app.brew).filter(Boolean);
    return [
      "#!/usr/bin/env bash",
      "# Appanvil setup — generated locally in your browser",
      "set -u",
      "",
      "if ! command -v brew >/dev/null 2>&1; then",
      "  echo 'Homebrew is required. Install it from https://brew.sh and run this script again.'",
      "  exit 1",
      "fi",
      "",
      "brew update",
      ...casks.map(cask => `brew install --cask ${cask} || true`),
      "",
      "echo 'Appanvil: setup complete.'"
    ].join("\n");
  }
  const refs = apps.map(app => app.flatpak).filter(Boolean);
  return [
    "#!/usr/bin/env bash",
    "# Appanvil setup — generated locally in your browser",
    "set -u",
    "",
    "if ! command -v flatpak >/dev/null 2>&1; then",
    "  echo 'Flatpak is required. Install it with your distro package manager and run this script again.'",
    "  exit 1",
    "fi",
    "",
    "flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo",
    ...refs.map(ref => `flatpak install -y flathub ${ref} || true`),
    "",
    "echo 'Appanvil: setup complete.'"
  ].join("\n");
}

function openForge() {
  if (!state.selected.size) return;
  const meta = platformMeta[state.platform];
  const script = generateScript();
  els.modalPlatform.textContent = meta.label;
  els.preview.textContent = script;
  els.scriptName.textContent = `appanvil-${state.platform}-setup.${meta.ext}`;
  els.modalDescription.textContent = state.platform === "windows"
    ? "Download the generated PowerShell script, inspect it if you like, then run it to install your selected apps with winget."
    : `Download the generated shell script, inspect it if you like, then run it to install your selected apps with ${state.platform === "macos" ? "Homebrew" : "Flatpak"}.`;
  els.modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeForge() {
  els.modal.hidden = true;
  document.body.style.overflow = "";
}

async function copyScript(button) {
  try {
    await navigator.clipboard.writeText(generateScript());
    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => button.textContent = original, 1200);
  } catch {
    button.textContent = "Copy failed";
    setTimeout(() => button.textContent = "Copy", 1200);
  }
}

function downloadScript() {
  const meta = platformMeta[state.platform];
  const blob = new Blob([generateScript()], {type: meta.mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appanvil-${state.platform}-setup.${meta.ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

els.search.addEventListener("input", e => { state.search = e.target.value; renderCatalog(); });
els.platformButtons.forEach(btn => btn.addEventListener("click", () => setPlatform(btn.dataset.platform)));
els.trayToggle.addEventListener("click", () => {
  els.tray.classList.toggle("open");
  els.trayToggle.setAttribute("aria-expanded", String(els.tray.classList.contains("open")));
});
els.headerSelection.addEventListener("click", () => {
  if (state.selected.size) {
    els.tray.classList.add("open");
    els.trayToggle.setAttribute("aria-expanded", "true");
  }
});
els.clear.addEventListener("click", () => {
  state.selected.clear(); renderCatalog(); renderSelection();
});
els.forge.addEventListener("click", openForge);
els.modalClose.addEventListener("click", closeForge);
els.modal.addEventListener("click", e => { if (e.target === els.modal) closeForge(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !els.modal.hidden) closeForge(); });
els.copy.addEventListener("click", () => copyScript(els.copy));
els.copyCommand.addEventListener("click", () => copyScript(els.copyCommand));
els.download.addEventListener("click", downloadScript);
document.querySelector("#year").textContent = new Date().getFullYear();

if (window.matchMedia("(pointer:fine)").matches) {
  window.addEventListener("pointermove", e => {
    document.documentElement.style.setProperty("--mx", e.clientX + "px");
    document.documentElement.style.setProperty("--my", e.clientY + "px");
  }, {passive:true});
}

renderCategories();
renderCatalog();
renderSelection();
