type Scene = "music" | "fashion";
type Stage = "input" | "quote" | "working" | "result" | "notice";
const offers = {
  music: {
    name: "心情音乐",
    price: 8,
    prompt: "给今天的小小胜利，配一首轻快的歌",
    label: "这次想表达什么？",
    result: "试听预制音乐片段。",
  },
  fashion: {
    name: "普莱造型",
    price: 12,
    prompt: "为普莱搭配一套清爽的出游造型",
    label: "想为普莱搭配什么风格？",
    result: "看看普莱的示例造型。",
  },
};
const button = (name: string) =>
  document.querySelector<HTMLButtonElement>(name)!;
const main = button("[data-main]");
const cancel = button("[data-cancel]");
const play = button("[data-play]");
const prompt = document.querySelector<HTMLTextAreaElement>("#prompt")!;
const status = document.querySelector<HTMLElement>("[data-status]")!;
const storageKey = "newplay.studio.demo.v1";
let balance = 40,
  reserved = 0;
let entries: string[] = ["初始演示额度：40 示例NC"];
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
  if (
    saved &&
    Number.isInteger(saved.balance) &&
    saved.balance >= 0 &&
    saved.balance <= 40 &&
    Array.isArray(saved.entries) &&
    saved.entries.every((e: unknown) => typeof e === "string")
  ) {
    balance = saved.balance;
    entries = saved.entries;
  }
} catch {
  /* The preview also runs with browser storage disabled. */
}
let scene: Scene = "music";
let stage: Stage = "input";
let timer: number | undefined;
let audio: AudioContext | undefined;
function account() {
  document
    .querySelectorAll("[data-balance]")
    .forEach((el) => (el.textContent = String(balance - reserved)));
  document.querySelector("[data-reserved]")!.textContent = String(reserved);
  document.querySelector("[data-entries]")!.replaceChildren(
    ...entries.map((item) => {
      const el = document.createElement("li");
      el.textContent = item;
      return el;
    }),
  );
}
function view(next: Stage, message: string) {
  stage = next;
  status.textContent = message;
  const labels = {
    input: "查看示例报价",
    quote: "确认示例报价",
    working: "正在处理…",
    result: "再试一次",
    notice: "返回创作",
  };
  main.textContent = labels[next];
  main.disabled = next === "working";
  cancel.hidden = next !== "quote" && next !== "working";
  play.hidden = next !== "result" || scene !== "music";
  prompt.disabled = next === "working";
  document
    .querySelectorAll<HTMLButtonElement>("[data-scene]")
    .forEach((b) => (b.disabled = next === "working"));
  account();
}
function reset() {
  clearTimeout(timer);
  reserved = 0;
  if (audio && audio.state !== "closed") void audio.close();
  view("input", "写下想法，先看报价，再决定。");
}
document.querySelectorAll<HTMLButtonElement>("[data-scene]").forEach((b) =>
  b.addEventListener("click", () => {
    scene = b.dataset.scene === "fashion" ? "fashion" : "music";
    const offer = offers[scene];
    document
      .querySelectorAll<HTMLButtonElement>("[data-scene]")
      .forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
    prompt.value = offer.prompt;
    document.querySelector("[data-prompt-label]")!.textContent = offer.label;
    document.querySelector("[data-price]")!.textContent =
      offer.price + " 示例NC";
    document.querySelector("[data-route]")!.textContent =
      scene === "music"
        ? "输入心情 → 示例报价 → 确认 → 预制片段"
        : "输入风格 → 示例报价 → 确认 → 预制造型";
    reset();
  }),
);
const requestedScene = new URLSearchParams(location.search).get("scene");
if (requestedScene === "fashion" || requestedScene === "music") {
  button('[data-scene="' + requestedScene + '"]').click();
}
prompt.addEventListener("input", () => {
  if (stage !== "input") reset();
});
main.addEventListener("click", () => {
  const offer = offers[scene];
  if (stage === "notice" || stage === "result") {
    reset();
    return;
  }
  if (!prompt.value.trim()) {
    view("input", "请先写下一句心情或造型想法。");
    prompt.focus();
    return;
  }
  if (stage === "input") {
    if (balance < offer.price) {
      view("notice", "本标签页的示例余额不足，本次未预占积分。");
      return;
    }
    view(
      "quote",
      offer.name +
        " · 示例报价 " +
        offer.price +
        " 示例NC。确认后将预占示例额度。",
    );
    return;
  }
  if (stage === "quote") {
    reserved = offer.price;
    view("working", "正在准备预制作品，可取消并释放示例额度。");
    timer = window.setTimeout(() => {
      balance -= reserved;
      reserved = 0;
      entries.unshift(offer.name + " · 示例消耗 " + offer.price + " NC");
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ balance, entries }),
        );
      } catch {}
      view("result", "示例作品已准备好。" + offer.result);
      if (scene === "fashion") {
        const img = new Image();
        img.src = "/assets/business/about-social.webp";
        img.alt = "普莱的蓝绿休闲示例造型";
        status.append(img);
      }
    }, 950);
  }
});
cancel.addEventListener("click", () => {
  clearTimeout(timer);
  reserved = 0;
  view("notice", "已取消本次体验，示例额度已释放。");
});
document.querySelectorAll<HTMLButtonElement>("[data-test]").forEach((b) =>
  b.addEventListener("click", () => {
    clearTimeout(timer);
    reserved = 0;
    const states: Record<string, string> = {
      insufficient: "示例余额不足。可返回创作，查看当前示例账户。",
      failure: "模拟生成失败，预占额度已释放。",
      timeout: "本次模拟等待超时，预占额度已释放。",
    };
    view("notice", states[b.dataset.test!]);
  }),
);
play.addEventListener("click", async () => {
  if (audio && audio.state !== "closed") {
    await audio.close();
    play.textContent = "试听示例片段";
    return;
  }
  try {
    const context = new AudioContext();
    audio = context;
    await context.resume();
    play.textContent = "停止试听";
    const pitches = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 392];
    pitches.forEach((frequency, i) => {
      const note = context.createOscillator(),
        gain = context.createGain(),
        start = context.currentTime + i * 0.24;
      note.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      note.connect(gain).connect(context.destination);
      note.start(start);
      note.stop(start + 0.3);
      if (i === pitches.length - 1)
        note.onended = () => {
          if (context.state !== "closed") void context.close();
          play.textContent = "试听示例片段";
        };
    });
  } catch {
    status.textContent = "此浏览器暂时无法播放音频。";
  }
});
account();
