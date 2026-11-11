const $ = (selector) => document.querySelector(selector);
let brands = [],
  tasks = [],
  selectedBrand;
const states = {
  queued: "Queued",
  running: "In progress",
  review: "Review",
  blocked: "Blocked",
  done: "Done",
};
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function api(path, body) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...(body !== undefined
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}
function notice(message) {
  $("#notice").textContent = message;
  $("#notice").hidden = false;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => ($("#notice").hidden = true), 6500);
}
function errorIn(dialog, message) {
  let p = dialog.querySelector(".inline-error");
  if (!p) {
    p = document.createElement("p");
    p.className = "inline-error";
    p.setAttribute("role", "alert");
    dialog.append(p);
  }
  p.textContent = message;
}
async function load() {
  brands = await api("/api/brands");
  selectedBrand = brands.find((b) => b.id === selectedBrand?.id) || brands[0];
  $("#login-view").hidden = true;
  $("#workspace").hidden = false;
  await render();
}
function record(name, detail) {
  return `<div class="record"><strong>${escape(name)}</strong><span>${escape(detail)}</span></div>`;
}
async function render() {
  tasks = await api(
    `/api/tasks?brand_id=${encodeURIComponent(selectedBrand.id)}`,
  );
  $("#brand-nav").innerHTML = brands
    .map(
      (b) =>
        `<button class="${b.id === selectedBrand.id ? "active" : ""}" data-brand="${escape(b.id)}" aria-current="${b.id === selectedBrand.id ? "page" : "false"}">${escape(b.name)}</button>`,
    )
    .join("");
  $("#brand-title").textContent = selectedBrand.name;
  $("#brand-eyebrow").textContent = selectedBrand.name.toUpperCase();
  $("#brand-voice").textContent = selectedBrand.voice;
  $("#task-count").textContent = tasks.length;
  $("#agent-count").textContent = selectedBrand.agents.length;
  $("#contact-count").textContent = selectedBrand.contacts.length;
  $("#review-count").textContent = tasks.filter(
    (t) => t.status === "review",
  ).length;
  $("#board").innerHTML = Object.entries(states)
    .map(([status, label]) => {
      const list = tasks.filter((t) => t.status === status);
      return `<div class="column"><h3>${label}<span>${list.length}</span></h3>${list.map((t) => `<button class="task-card" data-task="${escape(t.id)}"><span class="tag">${escape(t.capability)}${t.dispatch ? " · Paperclip" : ""}</span><strong>${escape(t.title)}</strong><small>${escape(t.context.contact.name)}</small><small>${escape(t.context.agent.name)}</small></button>`).join("") || '<p class="empty">No tasks here yet.</p>'}</div>`;
    })
    .join("");
  $("#people").innerHTML =
    selectedBrand.contacts.map((c) => record(c.name, c.role)).join("") +
    selectedBrand.profiles
      .map((p) => record(p.name, "Audience profile"))
      .join("");
  $("#accounts").innerHTML =
    selectedBrand.accounts.map((a) => record(a.name, a.identity)).join("") +
    selectedBrand.agents
      .map((a) => record(a.name, a.capabilities.join(", ")))
      .join("") +
    '<p class="record-note">Account references identify the intended account. No publishing connection is active in the demo.</p>';
}
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/login", { token: $("#token").value });
    $("#token").value = "";
    await load();
  } catch (err) {
    notice(err.message);
  }
});
$("#logout").addEventListener("click", async () => {
  try {
    await api("/api/logout", {});
    location.reload();
  } catch (err) {
    notice(err.message);
  }
});
$("#brand-nav").addEventListener("click", async (e) => {
  const button = e.target.closest("[data-brand]");
  if (button) {
    selectedBrand = brands.find((b) => b.id === button.dataset.brand);
    try {
      await render();
    } catch (err) {
      notice(err.message);
    }
  }
});
document
  .querySelectorAll(".close")
  .forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()),
  );
function options(select, items) {
  select.innerHTML = items
    .map((x) => `<option value="${escape(x.id)}">${escape(x.name)}</option>`)
    .join("");
}
function capabilities() {
  const agent = selectedBrand.agents.find(
    (a) => a.id === $("[name=agent_id]").value,
  );
  options(
    $("[name=capability]"),
    agent.capabilities.map((c) => ({ id: c, name: c })),
  );
}
$("#new-task").addEventListener("click", () => {
  $("#create-form").reset();
  $("#create-dialog .inline-error")?.remove();
  for (const [key, group] of Object.entries({
    contact_id: "contacts",
    profile_id: "profiles",
    account_id: "accounts",
    agent_id: "agents",
  }))
    options($(`[name=${key}]`), selectedBrand[group]);
  capabilities();
  $("#create-dialog").showModal();
});
$("[name=agent_id]").addEventListener("change", capabilities);
$("#create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = e.submitter;
  button.disabled = true;
  try {
    const payload = Object.fromEntries(new FormData(e.target));
    payload.brand_id = selectedBrand.id;
    await api("/api/tasks", payload);
    $("#create-dialog").close();
    await render();
    notice("Task created with its brand context.");
  } catch (err) {
    errorIn($("#create-dialog"), err.message);
  } finally {
    button.disabled = false;
  }
});
$("#board").addEventListener("click", async (e) => {
  const button = e.target.closest("[data-task]");
  if (button)
    try {
      await detail(button.dataset.task);
    } catch (err) {
      notice(err.message);
    }
});
async function detail(id) {
  const t = await api(`/api/tasks/${id}`);
  const c = t.context;
  $("#task-detail").innerHTML =
    `<h2 class="detail-title">${escape(t.title)}</h2><span class="tag">${states[t.status]}</span><p class="detail-brief">${escape(t.brief)}</p><div class="context-grid">${[
      ["Brand", c.brand.name],
      ["Contact", c.contact.name],
      ["Audience", c.profile.name],
      ["Acting account", c.account.identity],
      ["Agent", c.agent.name],
      ["Capability", t.capability],
    ]
      .map(
        ([k, v]) =>
          `<div class="context-item"><small>${k}</small>${escape(v)}</div>`,
      )
      .join(
        "",
      )}</div>${t.output ? `<h3>Submitted output</h3><div class="output">${escape(t.output)}</div>` : ""}<div class="actions" id="task-actions"></div><div id="action-form"></div><h3>Task history</h3><ol class="events">${t.history.map((h) => `<li><strong>${escape(h.action.replaceAll("_", " "))}</strong><small>${escape(h.actor)} · ${escape(new Date(h.at).toLocaleString())}</small>${h.detail.note ? `<p>${escape(h.detail.note)}</p>` : ""}${h.detail.to_agent ? `<p>Handed to ${escape(h.detail.to_agent)}</p>` : ""}</li>`).join("")}</ol>${t.dispatch ? `<p class="hint">Paperclip handoff: ${escape(t.dispatch.state)}. ${escape(t.dispatch.identifier || t.dispatch.note || "")} Remote progress is not synchronized in this pilot.</p>` : ""}`;
  const buttons = [];
  if (!t.dispatch) {
    if (t.status === "queued") buttons.push(["claim", "Start task"]);
    if (t.status === "running") buttons.push(["submit", "Submit output"]);
    if (t.status === "review")
      buttons.push(["approve", "Approve work"], ["revise", "Request changes"]);
    if (["queued", "running"].includes(t.status))
      buttons.push(["block", "Mark blocked"]);
    if (t.status === "blocked") buttons.push(["resume", "Resume task"]);
    if (["queued", "running", "blocked"].includes(t.status))
      buttons.push(["handoff", "Hand off"]);
    buttons.push(["note", "Add note"]);
  }
  $("#task-actions").innerHTML = buttons
    .map(
      ([a, label], i) =>
        `<button data-action="${a}" class="${i ? "secondary" : ""}">${label}</button>`,
    )
    .join("");
  $("#task-actions").onclick = async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    if (["claim", "approve", "resume"].includes(action)) {
      e.target.disabled = true;
      try {
        await api(`/api/tasks/${id}/${action}`, {});
        await render();
        await detail(id);
      } catch (err) {
        errorIn($("#detail-dialog"), err.message);
      }
      return;
    }
    const field = action === "submit" ? "output" : "note";
    let extra = "";
    if (action === "handoff") {
      const candidates = selectedBrand.agents.filter(
        (a) => a.capabilities.includes(t.capability) && a.id !== t.agent_id,
      );
      if (!candidates.length) {
        notice(
          "Add another agent with this capability to your private configuration for handoffs.",
        );
        return;
      }
      extra = `<label>Next agent<select name="next_agent">${candidates.map((a) => `<option value="${escape(a.id)}">${escape(a.name)}</option>`).join("")}</select></label>`;
    }
    $("#action-form").innerHTML =
      `<form id="action-editor">${extra}<label>${action === "submit" ? "Output for review" : "Note"}<textarea name="action_text" required rows="4"></textarea></label><button type="submit">Save ${action === "submit" ? "output" : "update"}</button></form>`;
    $("#action-editor").onsubmit = async (event) => {
      event.preventDefault();
      event.submitter.disabled = true;
      const payload = { [field]: $("[name=action_text]").value };
      if (action === "handoff") payload.agent_id = $("[name=next_agent]").value;
      try {
        await api(`/api/tasks/${id}/${action}`, payload);
        await render();
        await detail(id);
      } catch (err) {
        errorIn($("#detail-dialog"), err.message);
        event.submitter.disabled = false;
      }
    };
  };
  $("#detail-dialog .inline-error")?.remove();
  if (!$("#detail-dialog").open) $("#detail-dialog").showModal();
}
api("/api/me")
  .then(load)
  .catch(() => {});
