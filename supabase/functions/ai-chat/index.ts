/**
 * AI Chat Edge Function
 * Processes chat messages and generates AI responses using OpenAI
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
    // Get OpenAI API key from environment variables
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
    }

    // Initialize OpenAI client with the API key from environment
    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Get request body containing the messages array
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid request: messages array is required");
    }

    // Call OpenAI API with the provided message history
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-2025-04-14',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    // Extract the AI's response
    const aiResponse = response.choices[0]?.message?.content || null;

    // Return the response
    return new Response(
      JSON.stringify({ aiResponse }),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error) {
    console.error("Error in AI Chat Edge Function:", error);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate AI response",
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