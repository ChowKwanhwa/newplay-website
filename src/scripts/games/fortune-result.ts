import data from "./fortune-text.json";
import { key, saved, resultUrl, validChoice } from "./fortune-storage";
const params = new URLSearchParams(location.search);
const input = {
  theme: Number(params.get("theme")),
  sign: Number(params.get("sign")),
};
const choice = validChoice(input) ? input : { theme: 0, sign: 0 };
const topic = data.topics[choice.theme],
  sign = data.signs[choice.sign] + "座",
  theme = data.labels[choice.theme];
const el = (id: string) => document.getElementById(id)!;
const values: Record<string, string> = {
  context: sign + " / " + theme,
  tag: sign + "灵感 / " + topic.name,
  title: topic.title,
  verse: topic.verse,
  interpretation: topic.interpretation,
  perspective: sign + "的灵感视角",
  view: data.views[choice.sign],
};
document
  .querySelectorAll<HTMLElement>("[data-result]")
  .forEach((n) => (n.textContent = values[n.dataset.result!]));
if (choice.theme !== 0) {
  const tips = el("tips");
  tips.replaceChildren();
  topic.actions.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    tips.append(li);
  });
}
function matches(row: { theme: number; sign: number }) {
  return row.theme === choice.theme && row.sign === choice.sign;
}
function updateSave() {
  el("save").textContent = saved().some(matches) ? "已收藏" : "收藏此签";
}
el("save").onclick = () => {
  const rows = saved();
  if (rows.some(matches)) {
    el("result-status").textContent = "这张签已经保存在此浏览器。";
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify([choice, ...rows].slice(0, 12)));
    updateSave();
    el("result-status").textContent = "已收藏到此浏览器。";
  } catch {
    el("result-status").textContent = "此浏览器暂时无法保存，请下载签卡。";
  }
};
const follow = [topic.reflection, topic.actions[2]];
document.querySelectorAll<HTMLButtonElement>("[data-follow]").forEach(
  (b) =>
    (b.onclick = () => {
      el("follow-response").textContent = follow[Number(b.dataset.follow)];
    }),
);
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    el("result-status").textContent = "已复制。";
  } catch {
    el("result-status").textContent = text;
  }
}
const publicLink = new URL(resultUrl(choice), location.origin).href;
el("summary").onclick = () =>
  copy(
    [
      topic.title,
      topic.verse,
      "PLAI 的主题解读",
      topic.interpretation,
      ...topic.actions,
    ].join("\n"),
  );
el("share").onclick = async () => {
  const text = topic.title + "　" + topic.verse;
  if (navigator.share) {
    try {
      await navigator.share({ title: "普莱好运签", text, url: publicLink });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  await copy(text + "\n" + publicLink);
};
function asData(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
el("download").onclick = async () => {
  try {
    const [art, logo] = await Promise.all(
      [
        "/assets/games/fortune-art.webp",
        "/assets/games/fortune-wordmark.svg",
      ].map(async (p) => {
        const r = await fetch(p);
        if (!r.ok) throw Error();
        return asData(await r.blob());
      }),
    );
    const ns = "http://www.w3.org/2000/svg",
      svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 540 720");
    svg.setAttribute("width", "540");
    svg.setAttribute("height", "720");
    svg.setAttribute("xmlns", ns);
    function append(
      tag: string,
      attrs: Record<string, string>,
      content?: string,
    ) {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (content) n.textContent = content;
      svg.append(n);
    }
    append("rect", { width: "540", height: "720", rx: "18", fill: "#111e40" });
    append("image", {
      href: art,
      width: "540",
      height: "720",
      preserveAspectRatio: "xMidYMin meet",
    });
    append("image", {
      href: logo,
      x: "32",
      y: "28",
      width: "98",
      height: "28",
    });
    append(
      "text",
      { x: "36", y: "510", fill: "#b7c5e0", "font-size": "17" },
      sign + " / " + topic.name,
    );
    append(
      "text",
      {
        x: "36",
        y: "563",
        fill: "#ffb6bc",
        "font-weight": "bold",
        "font-size": "35",
      },
      topic.title,
    );
    const lines = topic.verse.replace(/\n/g, "").match(/.{1,23}/gu) || [];
    lines.forEach((line, i) =>
      append(
        "text",
        {
          x: "36",
          y: String(612 + i * 30),
          fill: "#f1f3ff",
          "font-size": "18",
        },
        line,
      ),
    );
    append(
      "text",
      { x: "36", y: "686", fill: "#b7c5e0", "font-size": "14" },
      "普莱好运签 · 本地灵感演示",
    );
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml",
      }),
      url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = topic.title + ".svg";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    el("result-status").textContent = "签卡已生成。";
  } catch {
    el("result-status").textContent = "签卡素材暂时无法读取，请重试。";
  }
};
updateSave();
