import { GoogleGenAI, Type } from "@google/genai";
import { AcademicEvent, EventType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const eventSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Título conciso del evento académico.",
      },
      date: {
        type: Type.STRING,
        description: "La fecha de entrega en formato AAAA-MM-DD.",
      },
      type: {
        type: Type.STRING,
        enum: ['Examen', 'Tarea', 'Lectura', 'Proyecto', 'Otro'],
        description: "El tipo de evento.",
      },
    },
    required: ["title", "date", "type"],
  },
};

export const extractEventsFromSyllabus = async (text: string): Promise<Omit<AcademicEvent, 'id' | 'subjectId' | 'subjectName' | 'subjectColor'>[]> => {
  const currentYear = new Date().getFullYear();
  const prompt = `
    Eres un asistente académico experto. Analiza el siguiente texto de un sílabo universitario y extrae todos los eventos académicos.
    Un evento académico es cualquier tarea o fecha con un plazo, como un examen, prueba, tarea, proyecto, trabajo o lectura obligatoria.
    Para cada evento, identifica su título, su fecha de entrega y su tipo.
    La fecha DEBE estar en formato AAAA-MM-DD. Si no se especifica un año, asume que el año actual es ${currentYear}.
    El tipo debe ser uno de los siguientes: 'Examen', 'Tarea', 'Lectura', 'Proyecto', 'Otro'.
    Devuelve los resultados como un arreglo JSON de objetos. Si no se encuentran eventos, devuelve un arreglo vacío.

    Texto del Sílabo:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as { title: string; date: string; type: EventType }[];
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("No se pudo procesar el sílabo. Por favor, inténtalo de nuevo.");
  }
};