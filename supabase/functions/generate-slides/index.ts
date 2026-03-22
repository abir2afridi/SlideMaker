import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { topic, description, slide_count = 6, api_key } = body;

    const apiKeyToUse = api_key || GOOGLE_AI_API_KEY;

    if (!apiKeyToUse) {
      console.error("API key is not provided and GOOGLE_AI_API_KEY is not set");
      return new Response(JSON.stringify({ error: "API key missing. Please provide one in settings." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a world-class professional presentation designer.
Task: Generate a comprehensive, high-impact, and deeply informative presentation.
Topic: "${topic}"
Context: "${description || 'Provide a professional and detailed overview.'}"
Slide count: ${slide_count}

Structure:
{
  "slides": [
    {
      "heading": "...",
      "subheading": "...",
      "description": "...",
      "bullets": ["...", "...", "...", "..."]
    }
  ],
  "presentation_title": "..."
}

CRITICAL: Return ONLY valid JSON. Every slide MUST have a heading, subheading, description (2-3 sentences), and 4-5 detail-rich bullet points.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyToUse}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
          response_mime_type: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("No response from Gemini API");
    }

    // Robust cleaning of the response text
    responseText = responseText.trim();
    if (responseText.startsWith("```json")) {
      responseText = responseText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const parsedData = JSON.parse(responseText);
      
      // Normalize slide fields
      if (parsedData.slides && Array.isArray(parsedData.slides)) {
        parsedData.slides = parsedData.slides.map((s: any) => ({
          heading: s.heading || s.title || topic,
          subheading: s.subheading || s.subtitle || '',
          description: s.description || s.text_content || s.content || '',
          bullets: s.bullets || s.bullet_points || []
        }));
      }

      return new Response(JSON.stringify({ success: true, ...parsedData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      const error = e as Error;
      console.error("JSON Error:", responseText);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
