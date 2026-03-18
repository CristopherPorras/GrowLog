const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

// Client-side rate limiting: max 10 calls per minute
const aiCallTimestamps: number[] = [];
function checkRateLimit(): void {
  const now = Date.now();
  const cutoff = now - 60_000;
  while (aiCallTimestamps.length > 0 && aiCallTimestamps[0] < cutoff) aiCallTimestamps.shift();
  if (aiCallTimestamps.length >= 10) throw new Error("Límite de llamadas IA alcanzado. Esperá un momento antes de continuar.");
  aiCallTimestamps.push(now);
}

async function ask(prompt: string, maxTokens = 300): Promise<string> {
  if (!API_KEY) throw new Error("API key no configurada. Verifica las variables de entorno.");
  checkRateLimit();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

/** Genera un título corto para una entrada de bitácora */
export async function generateEntryTitle(entryText: string): Promise<string> {
  const prompt = `Eres un asistente para estudiantes. Lee esta bitácora de aprendizaje y genera un título conciso y descriptivo (máximo 8 palabras, sin comillas, sin punto final). Solo devuelve el título, nada más.\n\nBitácora:\n${entryText.slice(0, 1500)}`;
  return ask(prompt, 60);
}

/** Devuelve sugerencias para mejorar la escritura de la bitácora */
export async function getSuggestions(entryText: string): Promise<string> {
  const prompt = `Eres un mentor de aprendizaje. Lee esta bitácora de un estudiante y da exactamente 3 sugerencias concretas para mejorarla. Responde en español, con formato de lista markdown (- sugerencia). Solo las 3 sugerencias, sin introducción ni conclusión.\n\nBitácora:\n${entryText.slice(0, 1500)}`;
  return ask(prompt, 250);
}

/** Genera un resumen semanal de aprendizaje */
export async function generateWeeklySummary(entriesText: string): Promise<string> {
  const prompt = `Eres un asistente de aprendizaje. Lee las bitácoras de esta semana y genera un resumen en español con este formato markdown:\n\n## ✨ Resumen de la semana\n\nUn párrafo corto con lo más destacado.\n\n### 🧠 Conceptos trabajados\n- Lista de conceptos o tecnologías\n\n### 💪 Progreso destacado\nUna observación positiva sobre su constancia.\n\nBitácoras:\n${entriesText.slice(0, 3000)}\n\nMáximo 200 palabras.`;
  return ask(prompt, 400);
}

/** Genera una bio profesional basada en proyectos y entradas */
export async function generateBio(summary: string): Promise<string> {
  const prompt = `Eres un asistente de marca personal. Escribe una bio profesional corta (máximo 3 oraciones, en primera persona) para el perfil público de este estudiante/desarrollador. Destaca sus áreas de aprendizaje y crecimiento. Solo devuelve la bio, sin comillas.\n\nResumen:\n${summary.slice(0, 2000)}`;
  return ask(prompt, 150);
}
