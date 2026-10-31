const QUESTIONS_KEY = "docpilot.stats.questions";

export function getQuestionsAsked(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(QUESTIONS_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function incrementQuestionsAsked(): number {
  const next = getQuestionsAsked() + 1;
  localStorage.setItem(QUESTIONS_KEY, String(next));
  return next;
}
