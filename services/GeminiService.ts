import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Se utiliza process.env.API_KEY según las directrices
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.warn(
    "Clave API de Gemini no encontrada. Por favor, establece API_KEY en tus variables de entorno. Las funciones de IA no funcionarán."
  );
}

// API Key debe pasarse como un objeto {apiKey: value}
// Se incluye un placeholder si la API Key no está definida para evitar errores de inicialización, 
// pero la funcionalidad real de la API fallará y lanzará un error específico.
const ai = new GoogleGenAI({ apiKey: apiKey || "YOUR_API_KEY_PLACEHOLDER" }); 
const model = 'gemini-2.5-flash-preview-04-17';

export const generateSimilarPhrases = async (basePhrase: string): Promise<string[]> => {
  if (!apiKey || apiKey === "YOUR_API_KEY_PLACEHOLDER") {
     throw new Error("La clave API de Gemini no está configurada. Por favor, configúrala en tus variables de entorno (API_KEY).");
  }

  const prompt = `Genera 3 frases motivacionales, concisas y de temática similar a la siguiente frase: '${basePhrase}'.
Por favor, devuelve las frases como un array JSON de strings, por ejemplo: ["frase1", "frase2", "frase3"].
Asegúrate de que la respuesta sea únicamente el array JSON válido, sin ningún texto o explicación adicional, y sin markdown como \`\`\`json.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{text: prompt}] }],
        config: {
            responseMimeType: "application/json",
            temperature: 0.7, 
            // thinkingConfig: { thinkingBudget: 0 } // Descomentar para menor latencia si es necesario
        },
    });

    if (!response.text) {
      throw new Error("La respuesta de la API de Gemini no contiene texto.");
    }
    let jsonStr = response.text.trim();
    
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr);

    if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'string')) {
      return parsedData as string[];
    } else {
      console.error("La API de Gemini devolvió una estructura JSON inesperada:", parsedData);
      throw new Error("La respuesta de la IA no estaba en el formato esperado (array de strings).");
    }
  } catch (error) {
    console.error('Error llamando a la API de Gemini:', error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("Clave API de Gemini inválida. Por favor, revisa tu configuración (API_KEY).");
        }
         throw new Error(`Error de la API de Gemini: ${error.message}`);
    }
    throw new Error('Ocurrió un error desconocido al obtener sugerencias de la API de Gemini.');
  }
};