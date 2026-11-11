/* Isolated design previews. Fictional state lives in this tab and resets on reload. */
const concept = document.body.dataset.concept;
const info = {
  focus: {
    number: "01",
    name: "Focus",
    reference: "Roma",
    headline: "Less on your mind.\nMore in your day.",
    sub: "A place for the things you need to do, and the AI helpers doing them with you.",
  },
  color: {
    number: "02",
    name: "Color",
    reference: "Paperclip",
    headline: "Your day,\nwith a little help.",
    sub: "Make room for what matters. Give your AI helpers the little things, the big plans, and everything between.",
  },
  calm: {
    number: "03",
    name: "Calm",
    reference: "Retinue",
    headline: "A clearer day\nstarts here.",
    sub: "Your plans, your progress, and a little help along the way.",
  },
}[concept];
const icon = (name, size = 20) => {
  const paths = {
    desk: '<path d="M3 8h18M5 8v12M19 8v12M8 4h8v4M5 13h14"/>',
    home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
    spark:
      '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 6-6 12 0 18 6-6 6-12 0-18"/>',
    bag: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    inbox: '<path d="M5 4h14l3 12v4H2v-4zM2 15h6l2 3h4l2-3h6"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
};
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let tasks = [
  {
    id: 1,
    title: "Find a great weekend away",
    detail: "Three easy train trips, all within your budget.",
    area: "Trips",
    status: "Ready for you",
    helper: "Research helper",
    icon: "globe",
    result:
      "Three ideas for a relaxed weekend: a coastal walk, a small-town food trail, or two days beside a lake. Next, choose an idea and add your starting city so the helper can research actual routes and prices.",
    note: "Illustrative draft only. No live travel search or reservation.",
  },
  {
    id: 2,
    title: "Make a meal plan for next week",
    detail: "Five simple dinners and one shopping list.",
    area: "Home",
    status: "Working on it",
    helper: "Planning helper",
    icon: "home",
    result:
      "The planning helper would use your food preferences to prepare five dinners and a shopping list. This preview does not run an agent.",
    note: "Example task. Nothing is running in the background.",
  },
  {
    id: 3,
    title: "Help me practice Spanish",
    detail: "A small daily plan for feeling more confident.",
    area: "Learning",
    status: "Needs your input",
    helper: "Learning helper",
    icon: "book",
    result:
      "How much time would you like to practice each day? This is the kind of small question your helper would bring back before making a plan.",
    note: "Example question. No account is connected.",
  },
];
let selectedArea = "All";
let statusFilter = "All";
const logo = `<a class="logo" href="index.html" aria-label="Agent Desk preview gallery"><span class="logo-mark">${icon("desk", 23)}</span>Agent Desk<span class="logo-period">.</span></a>`;
const switcher = `<div class="preview-bar"><a href="index.html">${icon("arrow", 15)} All three directions</a><span>DESIGN PREVIEW ${info.number} / ${info.name.toUpperCase()}</span><small>Fictional examples · no connected agents</small></div>`;
const avatar = '<span class="avatar" aria-label="Example user Alex">A</span>';
const helperPill = `<div class="helper-pill"><span class="mini-avatar violet">R</span><span class="mini-avatar orange">P</span><span class="mini-avatar blue">L</span><span>Research, planning & learning</span></div>`;
const composer = (compact = false) =>
  `<form class="composer ${compact ? "compact" : ""}" id="task-form"><label for="task-input">What would you like a hand with?</label><div class="composer-row"><input id="task-input" required maxlength="160" placeholder="Plan a weekend away…" autocomplete="off"><button class="primary" aria-label="Add example task" type="submit">${compact ? icon("plus") : icon("arrow")}</button></div><div class="composer-foot"><span>${icon("spark", 14)} You choose what happens next.</span><span>Try a task</span></div></form>`;
const panelHeading = (title) =>
  `<div class="panel-heading"><h2>${title}</h2><span class="subtle">3 things in motion</span></div>`;
const taskList = '<div id="task-list" class="task-list"></div>';
const nav = `<nav class="top-nav" aria-label="Preview sections"><button class="selected" data-view="today">Today</button><button data-view="tasks">My tasks</button><button data-view="helpers">My helpers</button></nav>`;
const areaCards = `<div class="areas" aria-label="Areas of life">${[
  ["Home", "home", "01"],
  ["Work", "bag", "02"],
  ["Learning", "book", "03"],
  ["Trips", "globe", "04"],
]
  .map(
    ([name, symbol, num]) =>
      `<button class="area-card area-${num}" data-area="${name}" aria-pressed="false"><span class="area-icon">${icon(symbol, 24)}</span><span class="area-name">${name}</span><span class="area-caption">${{ Home: "Make the everyday easier", Work: "Move your ideas forward", Learning: "A little progress, daily", Trips: "Make space for adventure" }[name]}</span><span class="area-arrow">${icon("arrow")}</span></button>`,
  )
  .join("")}</div>`;
let body = "";
if (concept === "focus")
  body = `
  <header class="top-header">${logo}${nav}${avatar}</header>
  <main class="focus-main"><section class="hero"><div class="eyebrow"><span class="live-dot"></span> YOUR EVERYDAY, A LITTLE LIGHTER</div><h1>${info.headline.replace("\n", "<br>")}</h1><p class="intro">${info.sub}</p>${composer()}${helperPill}<div class="quiet-note">One task at a time. Always your call.</div></section>
  <section class="focus-inbox" aria-label="Your task inbox"><div class="inbox-top"><span>${icon("inbox", 18)} YOUR DESK</span><span class="date-label">WED, NOV 11</span></div><div class="attention"><span class="big-number">01</span><div><span class="eyebrow">READY WHEN YOU ARE</span><h2>A little progress<br>to come back to.</h2></div></div>${taskList}<div class="inbox-bottom"><span>${icon("check", 15)} Nothing gets sent without your say.</span></div></section></main>
  <footer class="concept-footer"><span>01 / FOCUS</span><span>Less clutter. One clear next step.</span><a href="02-color.html">Next direction ${icon("arrow", 16)}</a></footer>`;
if (concept === "color")
  body = `
  <header class="top-header">${logo}${nav}${avatar}</header>
  <main class="color-main"><section class="color-hero"><div><div class="eyebrow">A LITTLE HELP GOES A LONG WAY</div><h1>${info.headline.replace("\n", "<br>")}</h1><p class="intro">${info.sub}</p></div><div class="helper-art" aria-label="Illustration of three friendly AI helpers"><div class="art-note">Good things, in motion.</div><div class="art-shape shape-one"><span>Research</span>${icon("globe", 38)}</div><div class="art-shape shape-two"><span>Plan</span>${icon("sun", 38)}</div><div class="art-shape shape-three"><span>Learn</span>${icon("book", 38)}</div><span class="art-star">✳</span></div></section>
  ${composer(true)}<section class="area-section"><div class="panel-heading"><h2>A little help with…</h2><button class="plain" data-area="All">Show everything ${icon("arrow", 15)}</button></div>${areaCards}</section>
  <section class="color-tasks">${panelHeading("Your helpers are on it")}${taskList}</section></main>
  <footer class="concept-footer"><span>02 / COLOR</span><span>Life is bigger than a task list.</span><a href="03-calm.html">Next direction ${icon("arrow", 16)}</a></footer>`;
if (concept === "calm")
  body = `
  <div class="calm-shell"><aside class="side-nav">${logo}<div class="nav-caption">YOUR SPACE</div><nav aria-label="Preview sections"><button class="selected" data-view="today">${icon("sun")}Today</button><button data-view="tasks">${icon("inbox")}My tasks<span>3</span></button><button data-view="helpers">${icon("spark")}My helpers</button></nav><div class="nav-caption">AREAS OF LIFE</div><nav aria-label="Areas of life">${[
    ["Home", "home"],
    ["Work", "bag"],
    ["Learning", "book"],
    ["Trips", "globe"],
  ]
    .map(
      ([name, symbol]) =>
        `<button data-area="${name}" aria-pressed="false">${icon(symbol)}${name}</button>`,
    )
    .join(
      "",
    )}</nav><div class="side-bottom"><div class="private-note">${icon("check", 18)} Your plans stay yours.<small>You decide what to share.</small></div><div class="profile">${avatar}<div>Alex<small>Your personal desk</small></div></div></div></aside>
  <main class="calm-main"><header class="day-header"><span>Wednesday, November 11</span><span class="demo-label">PERSONAL SPACE</span></header><section class="calm-hero"><div><div class="eyebrow">A LITTLE MORE ROOM TO THINK</div><h1>${info.headline.replace("\n", "<br>")}</h1><p class="intro">${info.sub}</p></div><div class="sun-art" aria-hidden="true">${icon("sun", 80)}<span>ONE THING AT A TIME</span></div></section>
  <div class="daily-stats"><button data-status="Ready for you"><span>01</span><strong>Ready for you</strong><small>Take a look when you're ready</small></button><button data-status="Working on it"><span>01</span><strong>Working on it</strong><small>Your helper has the next step</small></button><button data-status="Needs your input"><span>01</span><strong>Needs your input</strong><small>One small question to answer</small></button></div>
  <div class="calm-content"><section class="calm-tasks"><div class="panel-heading"><h2>Your next steps</h2><button class="plain" data-area="All">View all</button></div>${taskList}</section><aside class="calm-right"><div class="start-card"><span class="eyebrow">START SOMETHING SMALL</span><h2>What's on<br> your mind?</h2><p>A loose thought is a good place to start.</p>${composer(true)}</div><div class="help-note">${icon("spark", 18)}<p><strong>Your helpers remember the details.</strong><br>Keep preferences with each task, so you can pick up where you left off.</p></div></aside></div><footer class="calm-footer"><span>03 / CALM</span><a href="01-focus.html">Back to Focus ${icon("arrow", 16)}</a></footer></main></div>`;
document.querySelector("#preview").innerHTML =
  switcher +
  body +
  `
  <dialog id="task-dialog"><div class="dialog-top"><span class="eyebrow">EXAMPLE TASK</span><button class="close-dialog" aria-label="Close task details">×</button></div><div id="dialog-content"></div></dialog>
  <dialog id="helpers-dialog"><div class="dialog-top"><span class="eyebrow">YOUR AI HELPERS</span><button class="close-dialog" aria-label="Close helpers">×</button></div><h2>A hand with the everyday.</h2><p class="dialog-copy">Choose a helper for the job. These are example roles, not connected accounts.</p><div class="helper-row">${icon("globe")}<div><strong>Research helper</strong><p>Compare options and explain what matters.</p></div></div><div class="helper-row">${icon("sun")}<div><strong>Planning helper</strong><p>Turn a loose idea into manageable next steps.</p></div></div><div class="helper-row">${icon("book")}<div><strong>Learning helper</strong><p>Make a little practice part of your day.</p></div></div><p class="demo-disclosure">Concept only. Connecting your existing agent accounts is future work.</p></dialog>
  <div id="toast" role="status" aria-live="polite" hidden></div>`;
function renderTasks() {
  const shown = tasks.filter(
    (t) =>
      (selectedArea === "All" || t.area === selectedArea) &&
      (statusFilter === "All" || t.status === statusFilter),
  );
  const ready = document.querySelector(".big-number");
  if (ready)
    ready.textContent = String(
      tasks.filter((t) => t.status === "Ready for you").length,
    ).padStart(2, "0");
  const count = document.querySelector(".subtle");
  if (count)
    count.textContent = `${shown.length} ${shown.length === 1 ? "task" : "tasks"} in view`;
  const navCount = document.querySelector('[data-view="tasks"] span');
  if (navCount) navCount.textContent = tasks.length;
  document
    .querySelectorAll("[data-status]")
    .forEach(
      (b) =>
        (b.querySelector("span").textContent = String(
          tasks.filter((t) => t.status === b.dataset.status).length,
        ).padStart(2, "0")),
    );
  document.querySelector("#task-list").innerHTML = shown.length
    ? shown
        .map(
          (t) =>
            `<button class="task-card" data-task="${t.id}"><span class="task-symbol ${t.area.toLowerCase()}">${icon(t.icon, 20)}</span><span class="task-content"><span class="task-meta">${escapeHTML(t.area)}<span>·</span>${escapeHTML(t.helper)}</span><strong>${escapeHTML(t.title)}</strong><span class="task-description">${escapeHTML(t.detail)}</span><span class="task-status status-${t.status === "Ready for you" ? "ready" : t.status === "Working on it" ? "working" : t.status === "Done" ? "done" : "input"}"><i></i>${escapeHTML(t.status)}</span></span><span class="task-arrow">${icon("arrow", 17)}</span></button>`,
        )
        .join("")
    : '<div class="empty-state">Nothing here yet. Add a thought and make a start.</div>';
  document
    .querySelectorAll("[data-area]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.area === selectedArea)),
    );
}
function notify(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => (el.hidden = true), 4500);
}
function openTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  document.querySelector("#dialog-content").innerHTML =
    `<span class="detail-area">${icon(task.icon)} ${escapeHTML(task.area)} · ${escapeHTML(task.helper)}</span><h2>${escapeHTML(task.title)}</h2><div class="result-preview"><span class="eyebrow">${task.status === "Needs your input" ? "A QUESTION FOR YOU" : "WHAT YOUR HELPER BRINGS BACK"}</span><p>${escapeHTML(task.result)}</p></div><div class="progress-steps"><span>${icon("check", 14)} Task saved</span><span>${icon("clock", 14)} ${escapeHTML(task.status)}</span></div><p class="demo-disclosure">${escapeHTML(task.note)}</p><button class="primary wide" data-review="${task.id}">${task.status === "Done" ? "Close" : task.status === "Ready for you" ? "Looks good — mark done" : "Got it"}</button>`;
  document.querySelector("#task-dialog").showModal();
}
document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.matches(".close-dialog")) target.closest("dialog").close();
  if (target.dataset.task) openTask(Number(target.dataset.task));
  if (target.dataset.review) {
    const t = tasks.find((t) => t.id === Number(target.dataset.review));
    if (t.status === "Ready for you") {
      t.status = "Done";
      renderTasks();
      notify("Example marked done. Nothing was booked or sent.");
    }
    document.querySelector("#task-dialog").close();
  }
  if (target.dataset.area) {
    selectedArea = target.dataset.area;
    statusFilter = "All";
    renderTasks();
    notify(
      selectedArea === "All"
        ? "Showing all your example tasks"
        : `Showing ${selectedArea.toLowerCase()} tasks`,
    );
  }
  if (target.dataset.status) {
    statusFilter = target.dataset.status;
    selectedArea = "All";
    renderTasks();
    notify(`Showing tasks: ${statusFilter.toLowerCase()}`);
  }
  if (target.dataset.view === "helpers")
    document.querySelector("#helpers-dialog").showModal();
  if (["today", "tasks"].includes(target.dataset.view)) {
    selectedArea = "All";
    statusFilter = "All";
    renderTasks();
    document
      .querySelectorAll("[data-view]")
      .forEach((b) => b.classList.toggle("selected", b === target));
    if (target.dataset.view === "tasks")
      document
        .querySelector("#task-list")
        .scrollIntoView({ behavior: "smooth", block: "center" });
  }
});
document.querySelector("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#task-input");
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({
    id: Date.now(),
    title,
    detail: "A new thought, ready for its next step.",
    area: selectedArea === "All" ? "Home" : selectedArea,
    status: "Needs your input",
    helper: "Choose a helper",
    icon: "spark",
    result:
      "Your task has been added to this preview. In the finished product, you would choose or connect a helper and review its plan here.",
    note: "Stored in this tab only. Reloading clears this example.",
  });
  input.value = "";
  statusFilter = "All";
  renderTasks();
  notify("Added to this preview. No agent has been started.");
});
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (event) => {
    if (event.target === d) d.close();
  }),
);
renderTasks();
