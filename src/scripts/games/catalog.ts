const search = document.querySelector<HTMLInputElement>(".filters input")!;
const filter = document.querySelector<HTMLSelectElement>(".filters select")!;
const cards = [...document.querySelectorAll<HTMLElement>("[data-game]")];
function filterGames() {
  const term = search.value.trim().toLowerCase();
  cards.forEach((card) => {
    card.hidden = !(
      card.textContent?.toLowerCase().includes(term) &&
      (filter.selectedIndex === 0 || card.dataset.type === filter.value)
    );
  });
  document.getElementById("empty-games")!.hidden = cards.some(
    (card) => !card.hidden,
  );
}
search.oninput = filterGames;
filter.onchange = filterGames;
cards.forEach((card) => {
  card.onpointermove = (event) => {
    if (
      event.pointerType !== "mouse" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const box = card.getBoundingClientRect();
    card.style.setProperty(
      "--tilt-x",
      (0.5 - (event.clientY - box.top) / box.height) * 6 + "deg",
    );
    card.style.setProperty(
      "--tilt-y",
      ((event.clientX - box.left) / box.width - 0.5) * 8 + "deg",
    );
  };
});
const dialog = document.querySelector<HTMLDialogElement>("#match")!;
const grid = dialog.querySelector<HTMLElement>(".match-grid")!;
const status = document.getElementById("timer")!;
let ticker = 0,
  turn = 0,
  flipped: HTMLButtonElement[] = [],
  pairs = 0;
function stop() {
  clearInterval(ticker);
  clearTimeout(turn);
  flipped = [];
}
function start() {
  stop();
  grid.replaceChildren();
  pairs = 0;
  const end = Date.now() + 30000;
  const symbols = ["✦", "●", "◆", "▲", "✦", "●", "◆", "▲"];
  for (let n = symbols.length - 1; n > 0; n--) {
    const k = Math.floor(Math.random() * (n + 1));
    [symbols[n], symbols[k]] = [symbols[k], symbols[n]];
  }
  const tick = () => {
    const time = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    status.textContent = "剩余 " + time + " 秒 · 已配对 " + pairs + " / 4";
    if (!time) {
      stop();
      grid.querySelectorAll("button").forEach((b) => (b.disabled = true));
    }
  };
  tick();
  ticker = window.setInterval(tick, 500);
  symbols.forEach((symbol, i) => {
    const b = document.createElement("button");
    b.textContent = "？";
    b.setAttribute("aria-label", "翻开第 " + (i + 1) + " 张");
    grid.append(b);
    b.onclick = () => {
      if (flipped.includes(b) || flipped.length === 2) return;
      flipped.push(b);
      b.textContent = symbol;
      if (flipped.length !== 2) return;
      if (flipped[0].textContent === symbol) {
        flipped.forEach((x) => (x.disabled = true));
        flipped = [];
        pairs++;
        tick();
        if (pairs === 4) {
          stop();
          status.textContent = "四组都找到了！";
        }
      } else
        turn = window.setTimeout(() => {
          flipped.forEach((x) => (x.textContent = "？"));
          flipped = [];
        }, 650);
    };
  });
}
document.querySelector<HTMLButtonElement>("[data-match-open]")!.onclick =
  () => {
    dialog.showModal();
  };
document.getElementById("match-start")!.onclick = start;
document.getElementById("match-close")!.onclick = () => dialog.close();
dialog.onclose = () => {
  stop();
  grid.replaceChildren();
  status.textContent = "";
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden && dialog.open) dialog.close();
});
