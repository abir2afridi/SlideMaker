import { supabase } from "@/integrations/supabase/client";

const MODEL = "gemini-2.0-flash";

// Default API key (the one provided by the user)
const DEFAULT_API_KEY = "AIzaSyCeiesT2GOYjAna81iWgncAgLHy_7qYQHQ";

const STORAGE_KEY = "slidemaker_google_ai_key";
const USE_CUSTOM_KEY = "slidemaker_use_custom_google_key";

export const getCustomKey = (): string => {
  return localStorage.getItem(STORAGE_KEY) || "";
};

export const isUsingCustomKey = (): boolean => {
  return localStorage.getItem(USE_CUSTOM_KEY) === "true";
};

export const setCustomAPIKey = (key: string) => {
  localStorage.setItem(STORAGE_KEY, key);
};

export const switchToDefaultKey = () => {
  localStorage.setItem(USE_CUSTOM_KEY, "false");
};

export const switchToCustomKey = () => {
  localStorage.setItem(USE_CUSTOM_KEY, "true");
};

export const getActiveAPIKey = (): string => {
  if (isUsingCustomKey() && getCustomKey()) {
    return getCustomKey();
  }
  return DEFAULT_API_KEY;
};

interface RefineOptions {
  content: string;
  instruction: string;
}

/**
 * Text refinement with AI. Uses Supabase Edge Function for default key or direct Gemini call for custom key.
 */
export async function refineTextWithAI({ content, instruction }: RefineOptions): Promise<string> {
  const usingCustom = isUsingCustomKey() && getCustomKey().length > 0;
  
  if (usingCustom) {
    // Direct call with user's own key
    const apiKey = getCustomKey();
    const systemPrompt = `You are a professional copywriting assistant. 
Task: ${instruction}
Original text: "${content}"
Return ONLY the improved text string. No quotes, no explanations. Just the result.`;

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || "Failed to connect to Google Gemini API");
      }

      const data = await response.json();
      let resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      
      // Clean up markdown markers
      resultText = resultText.replace(/^```[a-z]*\s*|```$|^```\s*|```$/g, "").trim();
      resultText = resultText.replace(/^["']|["']$/g, "").trim();

      return resultText;
    } catch (error) {
      console.error("AI Error (Custom Key):", error);
      throw error;
    }
  } else {
    // Use Supabase Edge Function for Default Key
    try {
      const apiKey = isUsingCustomKey() ? getCustomKey() : null;
      const { data, error } = await supabase.functions.invoke("regenerate-text", {
        body: {
          mode: "selection",
          selected_text: content,
          instruction: instruction,
          api_key: apiKey,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "AI refinement failed");

      return data.improved_text;
    } catch (error) {
      console.error("AI Error (Edge Function):", error);
      throw error;
    }
  }
}
