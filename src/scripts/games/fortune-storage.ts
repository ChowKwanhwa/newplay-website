import data from "./fortune-text.json";
export type Choice = { theme: number; sign: number };
export const key = "newplay.fortune.keepsakes.v1";
export function validChoice(v: unknown): v is Choice {
  if (!v || typeof v !== "object") return false;
  const { theme, sign } = v as Choice;
  return (
    Number.isInteger(theme) &&
    Number.isInteger(sign) &&
    theme >= 0 &&
    theme < data.topics.length &&
    sign >= 0 &&
    sign < data.signs.length
  );
}
export function saved(): Choice[] {
  try {
    const rows = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(rows) ? rows.filter(validChoice).slice(0, 12) : [];
  } catch {
    return [];
  }
}
export function resultUrl({ theme, sign }: Choice) {
  return "/fortune/result/?theme=" + theme + "&sign=" + sign;
}
