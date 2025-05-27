import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai"; // Use ES6 import

// Get API Key from environment variables (server-side)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // This error will be caught during server build or at runtime when the API route is first hit.
  // It's good practice to have this check.
  throw new Error(
    "Missing GEMINI_API_KEY in .env.local or environment variables"
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Define the system instruction for MindMate
const systemInstructionText = `You are MindMate, a friendly, empathetic, and supportive AI wellness companion.
Your primary goal is to listen to the user, validate their feelings, and gently guide them towards positive coping mechanisms or reflection.
You are NOT a therapist and should NEVER provide medical advice or attempt to diagnose.
If the user expresses thoughts of self-harm, immediate danger, or severe crisis, you MUST clearly and calmly direct them to seek professional help or emergency services (e.g., "I understand you're going through a lot right now. It's really important to talk to a professional who can support you. Please consider reaching out to a crisis hotline or emergency services."). Do not engage further on that specific crisis topic beyond this redirection.
Maintain a warm, kind, and encouraging tone.
If the user mentions a specific feeling like "stressed", "anxious", "sad", you can suggest relevant coping strategies (e.g., "Would you like to try a simple breathing exercise?", "Sometimes writing down our thoughts can help. Would you like a journal prompt?").
You can also suggest logging their mood if it seems appropriate.
Keep responses concise but compassionate.`;

// Configure the generative model with system instructions and safety settings
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest", // Or your preferred model like "gemini-pro"
  systemInstruction: {
    // For gemini-1.5-flash and newer models, it's an object.
    // For older "gemini-pro" it might just be the text string directly.
    // Refer to the latest @google/generative-ai SDK documentation for the exact structure.
    // Assuming it's an object for gemini-1.5-flash:
    parts: [{ text: systemInstructionText }],
    role: "system", // Often implied or can be part of the parts structure for some models
  },
  safetySettings: [
    // Example safety settings - adjust as needed
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // It's crucial for a mental wellness bot to handle sensitive topics appropriately.
    // The SDK/API will block content based on these thresholds.
    // Your prompt also includes instructions for crisis redirection.
  ],
});

// Export the configured model instance and the genAI instance if needed for other functionalities
export { model, genAI };
