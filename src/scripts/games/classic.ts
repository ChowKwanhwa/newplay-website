const el = (id: string) => document.getElementById(id)!;
const buttons = (selector: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>(selector));
const league = buttons("[data-mode]"),
  period = el("rank-period") as HTMLSelectElement,
  kind = el("rank-kind") as HTMLSelectElement;
let agent = false,
  round = 1,
  held = false,
  task = "pair",
  done = false;
function displayRank(message = "") {
  const unavailable =
    message || (period.value === "today" ? "今日暂无示例成绩。" : "");
  el("rank-message").hidden = !unavailable;
  el("rank-message").textContent = unavailable;
  el("rank-content").hidden = Boolean(unavailable);
  const offset =
    (agent ? 37 : 0) +
    (period.value === "month" ? 123 : 0) +
    (kind.value === "pairs" ? 11 : kind.value === "straight" ? 26 : 0);
  league.forEach((b) =>
    b.setAttribute(
      "aria-pressed",
      String((b.dataset.mode === "agent") === agent),
    ),
  );
  el("range").textContent =
    (agent ? "Agent 练习榜" : "真人竞技榜") +
    "　" +
    period.selectedOptions[0].text +
    " / " +
    kind.selectedOptions[0].text;
  document
    .querySelectorAll<HTMLElement>("[data-name]")
    .forEach(
      (n) => (n.textContent = (agent ? "PLAI · " : "") + n.dataset.name),
    );
  document
    .querySelectorAll<HTMLElement>("[data-score]")
    .forEach((n) => (n.textContent = String(Number(n.dataset.score) + offset)));
}
league.forEach(
  (b) =>
    (b.onclick = () => {
      agent = b.dataset.mode === "agent";
      displayRank();
    }),
);
period.onchange = kind.onchange = () => displayRank();
buttons("[data-preview]").forEach(
  (b) =>
    (b.onclick = () =>
      displayRank(
        {
          loading: "示例加载中…",
          error: "示例加载失败。可选择「恢复示例榜」重试。",
          reset: "",
        }[b.dataset.preview as "loading" | "error" | "reset"],
      )),
);
const cards = buttons("[data-card]"),
  ranks = [3, 3, 4, 5, 6, 8],
  selected = new Set<number>();
const authorize = el("authorize") as HTMLButtonElement;
function refresh() {
  cards.forEach((b, i) =>
    b.setAttribute("aria-pressed", String(selected.has(i))),
  );
  el("count").textContent = "已选 " + selected.size + " 张";
  el("round").textContent = String(round).padStart(2, "0");
}
function select(i: number) {
  if (done || held) return;
  if (selected.has(i)) selected.delete(i);
  else selected.add(i);
  refresh();
}
function check() {
  const values = [...selected].map((i) => ranks[i]).sort((a, b) => a - b);
  const valid =
    task === "pair"
      ? values.length === 2 && values[0] === values[1]
      : values.length >= 3 &&
        values.every((n, i) => !i || n === values[i - 1] + 1);
  done = valid;
  el("hand-report").textContent = valid
    ? "组合正确，本局练习完成。"
    : task === "pair"
      ? "再试试，选择两张相同点数。"
      : "再试试，选择至少三张点数连续且不重复的牌。";
  if (done) authorize.disabled = true;
  return valid;
}
function release(note: string) {
  held = false;
  el("agent-state").textContent = "未授权 · 已关闭";
  el("agent-log").textContent = note;
  authorize.textContent = "授权当前演示局";
  el("takeover").hidden = true;
}
function reset() {
  round++;
  done = false;
  selected.clear();
  authorize.disabled = false;
  release("新一局尚未授权。");
  el("hand-report").textContent = "请按当前任务选牌。";
  refresh();
}
cards.forEach((b, i) => {
  b.onclick = () => select(i);
  b.onkeydown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      cards[(i + (e.key === "ArrowLeft" ? 5 : 1)) % 6].focus();
    } else if (/^[1-6]$/.test(e.key)) {
      e.preventDefault();
      select(Number(e.key) - 1);
    }
  };
});
buttons("[data-task]").forEach(
  (b) =>
    (b.onclick = () => {
      if (task === b.dataset.task) return;
      task = b.dataset.task!;
      reset();
      buttons("[data-task]").forEach((other) =>
        other.setAttribute("aria-pressed", String(other === b)),
      );
      el("c-task").textContent =
        task === "pair" ? "找出一对相同点数" : "找出至少三张连续点数";
    }),
);
el("again").onclick = reset;
el("check").onclick = () => {
  if (!held) check();
};
authorize.onclick = () => {
  if (done) return;
  if (!held) {
    held = true;
    el("agent-state").textContent = "已授权 · 等待开始";
    el("agent-log").textContent = "已授权当前演示局，尚未执行动作。";
    authorize.textContent = "开始本局托管";
    el("takeover").hidden = false;
    return;
  }
  selected.clear();
  (task === "pair" ? [0, 1] : [0, 2, 3]).forEach((i) => selected.add(i));
  refresh();
  check();
  release("已选择合法组合并检查一次。本局托管已停止。");
};
el("takeover").onclick = () => release("已由你接管，托管停止。");
function pause() {
  if (held) release("本局托管已暂停。回来后需重新授权。");
}
window.addEventListener("blur", pause);
window.addEventListener("offline", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
