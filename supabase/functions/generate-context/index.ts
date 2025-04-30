/**
 * Generate Context Edge Function
 * Generates student context summaries using OpenAI
 * Keeps API keys secure by handling all OpenAI interactions server-side
 */
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get request body
    const { promptData, openaiApiKey } = await req.json();
    
    // Check if API key was provided in the request
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is missing from the request");
    }

    // Initialize OpenAI client with the API key from the request body
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Enhanced system prompt for better context generation
    const systemPrompt = `You are an AI assistant that generates concise, informative summaries of student progress for school counselors.

Focus on providing a substantive, personalized summary that helps counselors quickly understand the student's current status, strengths, and areas needing attention.

Your summary should:
1. Be written in complete, concise sentences (approximately 100-150 words)
2. Include specific details about the student's progress through their roadmap
3. Highlight concrete strengths and achievements based on completed tasks and notes
4. Identify specific areas needing attention or improvement
5. Suggest 1-2 actionable next steps if appropriate
6. Have a professional tone appropriate for academic counseling

IMPORTANT: Do NOT use placeholders or template language (e.g., "[Insert specific strengths]"). Only include concrete information actually present in the student data. If specific information is missing, focus on what IS known rather than noting what's missing.`;

    // Call OpenAI API with enhanced prompting
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: promptData
        }
      ],
      temperature: 0.3, // Slightly lower temperature for more consistent outputs
      max_tokens: 700
    });

    // Extract the generated context
    const generatedContext = response.choices[0]?.message?.content || null;

    // Return the response
    return new Response(
      JSON.stringify({ 
        generatedContext 
      }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error) {
    console.error("Error in generate-context function:", error);
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate context",
        details: error.toString()
      }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 500
      }
    );
  }
});