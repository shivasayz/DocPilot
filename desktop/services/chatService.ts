import { getToken, setToken, API_BASE } from "./settingsService";

export type ChatReply = {
  answer: string;
  sources: string[];
};

export async function askKnowledge(query: string): Promise<ChatReply> {
  const token = getToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/knowledge-source/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, top_k: 5 }),
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Search failed" }));
    throw new Error(typeof err.detail === "string" ? err.detail : "Search failed");
  }
  const data = (await res.json()) as { answer?: string; sources?: string[] };
  return {
    answer: data.answer || "I could not find an answer in your library.",
    sources: data.sources ?? [],
  };
}
