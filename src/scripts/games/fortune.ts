import data from "./fortune-text.json";
import { key, saved, resultUrl, type Choice } from "./fortune-storage";
const form = document.querySelector<HTMLFormElement>("#f-form")!,
  dialog = document.querySelector<HTMLDialogElement>("#f-dialog")!,
  question = document.querySelector<HTMLTextAreaElement>("#question")!;
const el = (id: string) => document.getElementById(id)!;
const hero = document.querySelector<HTMLElement>(".f-hero")!;
let phase: "confirm" | "revealing" | "demo" | "loading" | "error" = "confirm";
let timer = 0,
  paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
function applyMotion() {
  hero.classList.toggle("f-paused", paused);
  el("motion").textContent = paused ? "恢复动效" : "暂停动效";
  el("motion").setAttribute("aria-pressed", String(paused));
}
applyMotion();
el("motion").onclick = () => {
  paused = !paused;
  applyMotion();
};
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  (e) => {
    paused = e.matches;
    applyMotion();
  },
);
function choice(): Choice {
  const fields = new FormData(form);
  return {
    theme: Number(fields.get("theme")),
    sign: Number(fields.get("sign")),
  };
}
function open(mode: typeof phase) {
  phase = mode;
  const c = choice();
  const copy = {
    confirm: [
      "确认本次体验",
      data.topics[c.theme].name +
        " · " +
        data.signs[c.sign] +
        "座。免费预设内容，不扣 NC。确认后揭开灵感签。",
      "确认揭签",
    ],
    revealing: [
      "正在揭签",
      "灵感签已准备好。你可以跳过演出，直接阅读。",
      "跳过演出，查看签文",
    ],
    demo: [
      "灵感签 · 演出示意",
      "先试一小步。留一点空间，给新的可能。动效样例，不扣 NC。",
      "去选择心情",
    ],
    loading: [
      "正在准备预览",
      "这里展示加载状态。你可以取消，或直接体验本地签文。",
      "查看确认预览",
    ],
    error: [
      "暂时未能载入",
      "这次没有扣除 NC。返回选择或重试本地内容。",
      "重新尝试",
    ],
  }[phase];
  el("dialog-title").textContent = copy[0];
  el("dialog-copy").textContent = copy[1];
  el("reveal").textContent = copy[2];
  if (!dialog.open) dialog.showModal();
  el("reveal").focus();
}
function read() {
  clearTimeout(timer);
  question.value = "";
  location.assign(resultUrl(choice()));
}
form.onsubmit = (e) => {
  e.preventDefault();
  open("confirm");
};
el("reveal").onclick = () => {
  if (phase === "demo") {
    dialog.close();
    document.getElementById("draw")?.scrollIntoView();
    form
      .querySelector<HTMLInputElement>("input:checked")
      ?.focus({ preventScroll: true });
    return;
  }
  if (phase === "error" || phase === "loading") {
    open("confirm");
    return;
  }
  if (phase === "revealing" || paused) {
    read();
    return;
  }
  open("revealing");
  timer = window.setTimeout(() => {
    if (dialog.open && phase === "revealing") read();
  }, 900);
};
el("f-cancel").onclick = () => dialog.close();
dialog.onclose = () => clearTimeout(timer);
dialog.onclick = (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
};
el("show-ritual").onclick = () => open("demo");
document
  .querySelectorAll<HTMLButtonElement>("[data-test]")
  .forEach(
    (b) =>
      (b.onclick = () =>
        open(b.dataset.test === "loading" ? "loading" : "error")),
  );
question.oninput = () =>
  (el("f-count").textContent = question.value.length + " / 100");
window.addEventListener("pagehide", () => {
  clearTimeout(timer);
  question.value = "";
  el("f-count").textContent = "0 / 100";
});
function renderSaved() {
  const rows = saved(),
    list = el("saved-list");
  list.replaceChildren();
  rows.forEach((c) => {
    const a = document.createElement("a");
    a.className = "saved-item";
    a.href = resultUrl(c);
    a.textContent =
      data.topics[c.theme].title + " · " + data.signs[c.sign] + "座";
    list.append(a);
  });
  el("saved-info").textContent = rows.length
    ? "保存在此浏览器；不包含私密问题。"
    : "尚无收藏。揭签后主动收藏，才会保存在此浏览器；不包含私密问题。";
}
el("clear-saved").onclick = () => {
  if (!saved().length) return;
  if (!confirm("清空此浏览器中收藏的所有灵感签？")) return;
  try {
    localStorage.removeItem(key);
    renderSaved();
  } catch {
    el("saved-info").textContent = "浏览器暂时无法清空收藏。";
  }
};
window.addEventListener("pageshow", renderSaved);
renderSaved();
