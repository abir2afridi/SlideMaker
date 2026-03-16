import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// OpenRouter API Keys provided by user
const TEXT_API_KEY = "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";
const IMAGE_API_KEY = "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";

// Helper to strip markdown code blocks from AI response
const cleanJsonResponse = (content: string) => {
  try {
    // 1. Try to find the first '{' and last '}'
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonCandidate = content.substring(start, end + 1).trim();
      // Basic validation that it's actually JSON
      if (jsonCandidate.startsWith('{') && jsonCandidate.endsWith('}')) {
        return jsonCandidate;
      }
    }
    
    // 2. Fallback to markdown code block regex
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = content.match(jsonRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (e) {
    console.error("Error cleaning JSON:", e);
  }
  return content.trim();
};

interface Block {
  id: string;
  type: string;
  content: unknown;
  metadata?: {
    imagePrompt?: string;
    [key: string]: unknown;
  };
}

interface Slide {
  id: string;
  layout: string;
  title: string;
  blocks: Block[];
}

interface AIResponse {
  slides: Slide[];
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
      images?: Array<{
        image_url?: {
          url?: string;
        };
      }>;
    };
    url?: string;
  }>;
  data?: Array<{
    url?: string;
  }>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, type = "pitch-deck", mode = "full", currentContent } = await req.json();
    console.log(`Processing request: mode=${mode}, type=${type}, prompt="${prompt}"`);

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "rewrite") {
      systemPrompt = `You are an expert editor and copywriter. Rewrite the following slide content to be more professional, engaging, and impactful. 
      Keep the structure (heading, paragraph, etc) similar but improve the words. 
      Return the updated blocks as a JSON array of blocks.`;
      userPrompt = `Rewrite this content: ${JSON.stringify(currentContent)}`;
    } else if (mode === "narrate") {
      systemPrompt = `You are a professional speaker and storyteller. Generate a compelling narration script for the following slide content.
      The script should be concise (30-60 seconds) and engaging.
      Return a JSON object: { "script": "The narration text" }`;
      userPrompt = `Slide content: ${JSON.stringify(currentContent)}`;
    } else if (mode === "single-slide") {
      systemPrompt = `You are a world-class presentation designer. Create a single high-impact slide about the following topic.
      Return a single JSON object representing the slide.
      Schema: { "id": "string", "layout": "SlideLayout", "title": "Headline", "blocks": [Blocks], "speakerNotes": "string" }`;
      userPrompt = `Create a slide about: ${prompt}`;
    } else {
      systemPrompt = `You are an Elite Strategy Consultant (McKinsey/BCG) and a Master Presentation Designer (Gamma.app/Beautiful.ai style). 
      Your task is to transform a simple prompt into a stunning, multi-slide, data-dense presentation.

      CRITICAL PRINCIPLES:
      1. ANALYTICAL DEPTH: NEVER provide shallow content. For every slide, research (in your knowledge) and provide deep, strategic insights. 
         - Include specific industry statistics, real-world examples, and detailed technological or business logic.
         - If the topic is a company, provide detailed SWOT analysis, market positioning, and revenue models.
      2. VISUAL STORYTELLING: Use a logical flow: Executive Summary -> Market Problem -> Solution Deep-Dive -> Secret Sauce -> Business Model -> Market TAM/SAM/SOM -> GTM Strategy -> Roadmap -> Team -> Investment Ask.
      3. LAYOUT VARIETY: You MUST use a balanced mix of layouts.
         - "feature-grid": Use for lists of benefits/services (at least 6 detailed items).
         - "stats": Use for market data (at least 4 distinct, high-impact metrics with labels and values).
         - "comparison": Use for "Standard Approach vs Your Approach" or "Current State vs Future State".
         - "timeline": Use for a 5-step detailed roadmap.
         - "team": Use for introducing a fictional but highly competent expert team (4 members).
         - "image-text": Use for deep dives. The text should be at least 2 paragraphs of 3-4 sentences each.
      4. IMAGE STRATEGY: For "hero", "image-text", and "closing", include an "image" block.
         - In the "metadata.imagePrompt", write a 50-word cinematic prompt that describes the scene, lighting, and mood related to the SLIDE CONTENT, not just the title.
      5. INFORMATION DENSITY: Every slide should feel like it was written by an expert. Avoid generic terms; use industry-specific terminology.

      SLIDE REQUIREMENTS:
      - Total Slides: Exactly 10-12 slides.
      - Content Length: Each paragraph should be substantial. Bullet points should be multi-sentence "power bullets".
      - Tone: Authoritative, visionary, and professional.

      Schema:
      SlideLayout: "hero" | "bullets" | "image-text" | "feature-grid" | "stats" | "comparison" | "timeline" | "team" | "closing"
      Block: { "id": "string", "type": "BlockType", "content": "any", "metadata": { "imagePrompt": "string" } }
      BlockType: "heading1" | "heading2" | "paragraph" | "bulletList" | "image" | "stat" | "comparison" | "timeline" | "feature-grid"
      
      Return ONLY valid JSON.`;
      userPrompt = `Create a world-class, comprehensive, 12-slide strategy deck about: ${prompt}`;
    }

    console.log(`Calling OpenRouter Hermes-3 for text...`);

    // 1. Generate Text Content
    const textResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TEXT_API_KEY}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "DeckAI",
      },
      body: JSON.stringify({
        model: "nousresearch/hermes-3-llama-3.1-405b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Note: Some models ignore response_format, so we clean the content manually later
        response_format: { type: "json_object" }
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error(`OpenRouter Text error (${textResponse.status}):`, errorText);
      throw new Error(`Text generation failed: ${textResponse.status}`);
    }

    const textData = await textResponse.json() as OpenRouterResponse;
    const rawContent = textData.choices?.[0]?.message?.content || "";
    
    // Clean and Parse JSON
    let result;
    try {
      const cleanedContent = cleanJsonResponse(rawContent);
      result = JSON.parse(cleanedContent);
      console.log("Successfully parsed AI text response");
    } catch (parseError) {
      console.error("JSON Parse Error. Raw content:", rawContent);
      throw new Error("Failed to parse AI response as JSON");
    }

    // 2. Generate Images for relevant layouts with GUARANTEED fallback
    if (result && (result as AIResponse).slides && Array.isArray((result as AIResponse).slides)) {
      console.log(`Processing images for ${(result as AIResponse).slides.length} slides...`);
      
      const slidesWithImages = (result as AIResponse).slides.map(async (slide: Slide) => {
        const needsImage = slide.layout === "hero" || slide.layout === "image-text" || 
                          slide.blocks?.some((b: Block) => b.type === "image");
        
        if (needsImage) {
          // 1. Assign a high-quality fallback immediately
          let finalImageUrl = `https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80`; // Modern Office
          
          if (slide.layout === "hero") finalImageUrl = `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80`; // Analytics
          if (slide.title.toLowerCase().includes("tech") || slide.title.toLowerCase().includes("ai")) finalImageUrl = `https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80`; // Technology
          if (slide.title.toLowerCase().includes("team") || slide.title.toLowerCase().includes("people")) finalImageUrl = `https://images.unsplash.com/photo-1522071823916-d44b24505f63?auto=format&fit=crop&w=1200&q=80`; // Team

          try {
            console.log(`Generating AI image for: ${slide.title}`);
            const imagePrompt = slide.blocks?.find((b: Block) => b.type === "image")?.metadata?.imagePrompt as string || 
                               `Professional 4k corporate photo for a slide titled "${slide.title}". Clean, modern, high-end commercial aesthetic.`;
            
            const imgResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${IMAGE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "black-forest-labs/flux.2-pro",
                messages: [{ role: "user", content: imagePrompt }]
              }),
            });

            if (imgResponse.ok) {
              const imgData = await imgResponse.json() as OpenRouterResponse;
              console.log(`Image AI Response for "${slide.title}":`, JSON.stringify(imgData).substring(0, 200));
              
              // 1. Try message content (common for OpenRouter)
              let imageUrl = imgData.choices?.[0]?.message?.content?.match(/https?:\/\/\S+/)?.[0];
              
              // 2. Try the dedicated URL fields
              if (!imageUrl) {
                imageUrl = imgData.choices?.[0]?.url || imgData.data?.[0]?.url;
              }
              
              // 3. Try to find any URL in the entire JSON if first two failed
              if (!imageUrl) {
                const jsonString = JSON.stringify(imgData);
                const urlMatch = jsonString.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)(?:\?[^"'\s]+)?/i);
                if (urlMatch) imageUrl = urlMatch[0];
              }

              if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                finalImageUrl = imageUrl;
                console.log(`Bingo! AI image acquired for "${slide.title}": ${finalImageUrl.substring(0, 50)}...`);
              } else {
                console.warn(`Could not extract image URL for "${slide.title}", using fallback.`);
              }
            } else {
              const errorText = await imgResponse.text();
              console.error(`AI Image API error (${imgResponse.status}):`, errorText);
            }
          } catch (err) {
            console.error(`AI Image generation failed, using fallback:`, err);
          }

          // Ensure the slide has the block and content
          if (!slide.blocks) slide.blocks = [];
          const imageBlock = slide.blocks.find((b: Block) => b.type === "image");
          if (imageBlock) {
            imageBlock.content = finalImageUrl;
          } else {
            slide.blocks.push({
              id: `img-${crypto.randomUUID()}`,
              type: "image",
              content: finalImageUrl
            });
          }
        }
      });

      await Promise.all(slidesWithImages);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


