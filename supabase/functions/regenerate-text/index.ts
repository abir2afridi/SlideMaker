import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SlideData {
  heading: string;
  subheading?: string;
  description: string;
  bullets: string[];
}

interface RequestBody {
  mode?: "selection" | "whole_slide";
  selected_text?: string;
  text_type?: "bullet" | "heading" | "description";
  slide_heading?: string;
  slide_context?: string;
  instruction?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const api_key = body.api_key;
    const apiKeyToUse = api_key || GOOGLE_AI_API_KEY;

    if (!apiKeyToUse) {
      console.error("API key is not provided and GOOGLE_AI_API_KEY is not set");
      return new Response(JSON.stringify({ error: "API key missing. Please provide one in settings." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mode = body.mode || "selection";
    const selectedText = body.selected_text || "";
    const textType = body.text_type || "bullet";
    const slideHeading = body.slide_heading || "";
    const slideContext = body.slide_context || "";
    const instruction = body.instruction || "improve and rewrite for better clarity and impact";

    if (mode === "selection" && !selectedText) {
      return new Response(
        JSON.stringify({ error: "selected_text is required for selection mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let prompt = "";
    let isJsonMode = false;

    if (mode === "whole_slide") {
      isJsonMode = true;
      prompt = `You are a professional presentation content expert.
Task: Completely rewrite and significantly expand the content for a single presentation slide.

Slide context/Topic: "${slideContext}"
Current slide title: "${slideHeading}"
User instructions: "${instruction}"

Rules:
1. Elevate the content to be highly informative, professional, and authoritative.
2. The 'description' must be 2-3 detailed and sophisticated sentences.
3. Provide 4-5 high-impact bullet points. Each bullet MUST be a complete, informative sentence.
4. Add specific facts, context, or examples where relevant.
5. Return ONLY a valid JSON object with this exact structure:
{
  "heading": "Authoritative Slide Heading",
  "subheading": "A descriptive subtitle",
  "description": "Explaining the core concept in 2-3 detailed sentences...",
  "bullets": [
    "Detail 1 with evidence or context",
    "Detail 2 with impact or example",
    "Detail 3 explaining key insight",
    "Detail 4 providing actionable takeaway"
  ]
}
6. No surrounding text, no markdown backticks, just raw JSON.`;
    } else {
      prompt = `You are an expert copywriter and presentation designer.
Task: Rewrite and improve the following specific ${textType} element for a slide.

Slide context: "${slideHeading} - ${slideContext}"
User instruction: "${instruction}"

Original text to refine: 
"${selectedText}"

Rules for the rewrite:
- Maintain the original intent but upgrade the vocabulary and depth.
- ${textType === 'bullet' ? 'Must be a single, complete, and informative sentence (max 25 words).' : ''}
- ${textType === 'heading' ? 'Must be punchy yet descriptive (max 8 words).' : ''}
- ${textType === 'description' ? 'Must be 2-3 detailed and context-rich sentences.' : ''}
- Make it sound professional, sophisticated, and valuable.
- Return ONLY the improved text string.
- No quotes, no explanations. Just the result.`;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyToUse}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          ...(isJsonMode ? { response_mime_type: "application/json" } : {})
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini Error:", errText);
      return new Response(JSON.stringify({ error: "Gemini API failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    // Clean up markdown markers if not using JSON mode or if model returned them anyway
    content = content.replace(/^```json\s*|```$|^```\s*|```$/g, "").trim();

    if (!content) {
      throw new Error("Gemini returned empty content");
    }

    if (mode === "whole_slide") {
      try {
        const slideData: SlideData = JSON.parse(content);
        return new Response(
          JSON.stringify({ success: true, mode: "whole_slide", slide_data: slideData }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e: unknown) {
        console.error("JSON Parse Error:", e);
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response as valid JSON", details: content.substring(0, 100) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const improvedText = content.replace(/^["']|["']$/g, "").trim();

    return new Response(
      JSON.stringify({
        success: true,
        mode: "selection",
        original_text: selectedText,
        improved_text: improvedText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const error = err as Error;
    console.error("Fatal Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
