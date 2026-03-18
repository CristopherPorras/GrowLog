const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

async function ask(prompt: string, maxTokens = 300): Promise<string> {
  if (!API_KEY) throw new Error("API key no configurada — revisa el archivo .env");

  console.log("[Gemini] Llamando API, key starts with:", API_KEY.slice(0, 8));

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message ?? `HTTP ${res.status}`;
    console.error("[Gemini] Error:", msg);
    throw new Error(msg);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

/** Genera un título corto para una entrada de bitácora */
export async function generateEntryTitle(entryText: string): Promise<string> {
  const prompt = `Eres un asistente para estudiantes. Lee esta bitácora de aprendizaje y genera un título conciso y descriptivo (máximo 8 palabras, sin comillas, sin punto final). Solo devuelve el título, nada más.

Bitácora:
${entryText.slice(0, 1500)}`;

  return ask(prompt, 60);
}

/** Devuelve sugerencias para mejorar la escritura de la bitácora */
export async function getSuggestions(entryText: string): Promise<string> {
  const prompt = `Eres un mentor de aprendizaje. Lee esta bitácora de un estudiante y da exactamente 3 sugerencias concretas para mejorarla. Las sugerencias deben ayudar a que sea más clara, completa y útil para el lector. Responde en español, con formato de lista markdown (- sugerencia). Solo las 3 sugerencias, sin introducción ni conclusión.

Bitácora:
${entryText.slice(0, 1500)}`;

  return ask(prompt, 250);
}

/** Genera un resumen semanal de aprendizaje */
export async function generateWeeklySummary(entriesText: string): Promise<string> {
  const prompt = `Eres un asistente de aprendizaje. Lee las bitácoras de esta semana de un estudiante y genera un resumen semanal en español con este formato markdown:

## ✨ Resumen de la semana

Un párrafo corto con lo más destacado.

### 🧠 Conceptos trabajados
- Lista de conceptos o tecnologías mencionados

### 💪 Progreso destacado
Una observación positiva y concreta sobre su constancia o avance.

Bitácoras de la semana:
${entriesText.slice(0, 3000)}

Responde solo el resumen en markdown, máximo 200 palabras. Si no hay entradas suficientes, menciona que fue una semana tranquila y anima a escribir más.`;

  return ask(prompt, 400);
}

/** Genera una bio profesional basada en los proyectos y entradas del usuario */
export async function generateBio(summary: string): Promise<string> {
  const prompt = `Eres un asistente de marca personal para desarrolladores. Con base en el siguiente resumen de proyectos de aprendizaje de un estudiante/desarrollador, escribe una bio profesional corta (máximo 3 oraciones, en primera persona) para su perfil público. La bio debe destacar sus áreas de aprendizaje, su constancia y su crecimiento. Solo devuelve la bio, sin comillas, sin etiquetas.

Resumen de aprendizaje:
${summary.slice(0, 2000)}`;

  return ask(prompt, 150);
}
