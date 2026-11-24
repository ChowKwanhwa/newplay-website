const button = document.querySelector<HTMLButtonElement>("#charge")!;
const track = document.querySelector<HTMLElement>(".charge")!;
const avatar = document.querySelector<HTMLElement>("#jumper")!;
const report = document.querySelector<HTMLElement>("#jump-report")!;
const key = "newplay.jump.tab-best";
let best = 0,
  score = 0,
  started: number | null = null,
  frame = 0,
  ended = false;
try {
  best = Number(sessionStorage.getItem(key)) || 0;
} catch {}
function refresh() {
  document.getElementById("score")!.textContent = String(score);
  document.getElementById("best")!.textContent = String(best);
  document.getElementById("best-status")!.textContent = best
    ? "本地最好成绩"
    : "尚未挑战";
}
function power() {
  const progress = ((performance.now() - started!) / 16) % 200;
  return progress > 100 ? 200 - progress : progress;
}
function paint(n: number) {
  track.style.setProperty("--power", n + "%");
  track.setAttribute("aria-valuenow", String(Math.round(n)));
}
function charge() {
  if (started === null) return;
  paint(power());
  frame = requestAnimationFrame(charge);
}
function start() {
  if (started !== null || ended) return;
  started = performance.now();
  report.textContent = "蓄力中，绿色区间松开。";
  charge();
}
function cancel() {
  cancelAnimationFrame(frame);
  started = null;
  paint(0);
}
function jump() {
  if (started === null) return;
  const n = power();
  cancel();
  paint(n);
  const hit = n >= 45 && n <= 75;
  if (hit) {
    score += 10;
    best = Math.max(best, score);
    try {
      sessionStorage.setItem(key, String(best));
    } catch {}
    report.textContent = "落地成功！+10 分。准备好下一跳。";
  } else {
    ended = true;
    button.textContent = "再来一次";
    report.textContent =
      n < 45 ? "差一点，蓄力再久一点。" : "跳过了，试着早点松开。";
  }
  if (!matchMedia("(prefers-reduced-motion:reduce)").matches)
    avatar.animate(
      [
        { translate: "0 0" },
        { translate: "55% -38%" },
        { translate: "120% 0", opacity: 0 },
      ],
      { duration: 380 },
    );
  refresh();
}
function reset() {
  cancel();
  score = 0;
  ended = false;
  button.textContent = "按住蓄力，松开跳跃";
  report.textContent = "普莱准备好了。试着跳上第一块平台。";
  refresh();
}
button.onpointerdown = (e) => {
  if (e.button !== 0 || !e.isPrimary) return;
  e.preventDefault();
  button.focus();
  button.setPointerCapture(e.pointerId);
  if (ended) {
    reset();
    return;
  }
  start();
};
button.onpointerup = jump;
button.onpointercancel = cancel;
button.onkeydown = (e) => {
  if (e.code === "Space" || e.key === "Enter") {
    e.preventDefault();
    if (!e.repeat) {
      if (ended) reset();
      else start();
    }
  }
};
button.onkeyup = (e) => {
  if (e.code === "Space" || e.key === "Enter") {
    e.preventDefault();
    jump();
  }
};
document.getElementById("reset")!.onclick = reset;
window.addEventListener("blur", () => {
  if (started !== null) {
    cancel();
    report.textContent = "已暂停蓄力，按住按钮再试一次。";
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancel();
});
document.getElementById("copy")!.onclick = async () => {
  const invitation =
    "和普莱一起跳一跳！" + new URL("/jump/", location.href).href;
  try {
    await navigator.clipboard.writeText(invitation);
    document.getElementById("copy-status")!.textContent = " 邀请已复制";
  } catch {
    document.getElementById("copy-status")!.textContent = invitation;
  }
};
refresh();
