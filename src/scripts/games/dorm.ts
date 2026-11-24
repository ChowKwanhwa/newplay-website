import states from "./dorm-states.json";
type Phase = keyof typeof states;
let phase: Phase = "Start";
const get = (id: string) => document.getElementById(id)!;
const keys = [...document.querySelectorAll<HTMLButtonElement>("[data-move]")];
const positions: Partial<Record<Phase, [number, number]>> = {
  Spawn: [44.9, 69.7],
  Door: [45.9, 47.3],
  Inside: [61.9, 51],
  Junction: [44.9, 34.1],
  Occupied: [44.9, 16.3],
  Bedside: [64.4, 66.9],
};
function render(next: Phase) {
  phase = next;
  const state = states[phase];
  for (const [id, value] of Object.entries({
    "d-board": state.board,
    "d-step": state.step,
    coins: state.coin,
    energy: state.power,
    "d-label": state.label,
    "d-title": state.title,
    "d-body": state.body,
    "map-note": state.caption || "先走动，找到空床，再上床。",
  }))
    get(id).textContent = value;
  get("map-title").textContent =
    phase === "Start" ? "熄灯前，\n先跑起来。" : "";
  get("d-next").querySelector("b")!.textContent = state.action;
  get("d-fail").hidden = phase !== "Defend";
  const map = document.querySelector<HTMLElement>(".map")!;
  map.dataset.phase = phase;
  const sleeping = [
    "Sleeping",
    "Build",
    "Defend",
    "Success",
    "Failure",
  ].includes(phase);
  map.classList.toggle("sleeping", sleeping);
  get("turret").hidden = !["Build", "Defend", "Success"].includes(phase);
  get("map-alert").hidden = !["Defend", "Failure", "Occupied"].includes(phase);
  get("map-alert").textContent =
    phase === "Defend"
      ? "⚠ 房门受击"
      : phase === "Occupied"
        ? "已入住 · 换个方向找找"
        : "防线失守";
  const mapAction = get("map-action");
  mapAction.hidden = phase !== "Build" && phase !== "Bedside";
  mapAction.textContent = phase === "Build" ? "＋" : "到床边了 · 上床躺下 ↗";
  mapAction.setAttribute("aria-label", state.action);
  document.querySelector<HTMLElement>(".controller")!.style.visibility =
    sleeping ? "hidden" : "visible";
  map.style.setProperty(
    "--health",
    phase === "Defend"
      ? "38%"
      : phase === "Success"
        ? "70%"
        : phase === "Failure"
          ? "0%"
          : "100%",
  );
  const pos = positions[phase],
    plai = get("d-plai");
  plai.hidden = !pos && phase !== "Start";
  plai.style.cssText = pos
    ? "width:10.1%;height:15.6%;left:" + pos[0] + "%;top:" + pos[1] + "%"
    : "";
  keys.forEach((key) => {
    key.disabled = !(key.dataset.move! in state.moves);
  });
}
function move(dir: string) {
  const moves = states[phase].moves as Record<string, Phase>;
  if (moves[dir]) render(moves[dir]);
}
get("d-next").onclick = () => render(states[phase].next as Phase);
get("map-action").onclick = () => render(states[phase].next as Phase);
get("d-fail").onclick = () => render("Failure");
keys.forEach((key) => (key.onclick = () => move(key.dataset.move!)));
document.querySelector<HTMLElement>(".d-console")!.onkeydown = (event) => {
  const dirs: Record<string, string> = {
    ArrowUp: "up",
    w: "up",
    ArrowLeft: "left",
    a: "left",
    ArrowRight: "right",
    d: "right",
    ArrowDown: "down",
    s: "down",
  };
  if (dirs[event.key]) {
    event.preventDefault();
    move(dirs[event.key]);
  }
};
document.querySelectorAll<HTMLButtonElement>("[data-league]").forEach(
  (b) =>
    (b.onclick = () => {
      const agent = b.dataset.league === "agent";
      document
        .querySelectorAll<HTMLElement>("[data-human]")
        .forEach(
          (n) => (n.textContent = (agent ? n.dataset.agent : n.dataset.human)!),
        );
      document
        .querySelectorAll("[data-league]")
        .forEach((n) => n.setAttribute("aria-pressed", String(n === b)));
    }),
);
