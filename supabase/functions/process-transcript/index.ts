/**
 * Process Transcript Edge Function
 * Analyzes meeting transcripts to extract actionable items, tasks, and deliverables
 * Keeps API keys secure by handling OpenAI interactions server-side
 */
import OpenAI from "npm:openai@4.28.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Supabase client setup for the edge function
const supabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient(supabaseUrl, supabaseKey);
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
    const { 
      transcriptText, 
      phases, 
      tasks, 
      studentId,
      openaiApiKey
    } = await req.json();
    
    if (!transcriptText) {
      throw new Error("Transcript text is required");
    }
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is missing from the request");
    }

    // Debug information
    console.log(`Processing transcript: ${transcriptText.length} characters`);
    console.log(`Phases: ${phases?.length || 0}, Tasks: ${tasks?.length || 0}`);
    console.log(`Student ID: ${studentId}`);
    console.log(`API Key present: ${!!openaiApiKey}`);

    // Initialize OpenAI client with the API key from the request body
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Get Supabase connection info from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL or service role key is missing");
    }
    
    const supabase = supabaseClient(supabaseUrl, supabaseKey);
    
    // Fetch existing subtasks for this student to avoid duplication
    let existingSubtasks: any[] = [];
    try {
      const { data, error } = await supabase
        .from('student_subtasks')
        .select(`
          id,
          name,
          status,
          task_id,
          tasks:task_id(
            name,
            phase_id,
            phases:phase_id(
              name
            )
          )
        `)
        .eq('student_id', studentId);
        
      if (error) {
        console.error("Error fetching existing subtasks:", error);
      } else {
        existingSubtasks = data || [];
        console.log(`Found ${existingSubtasks.length} existing subtasks for the student`);
      }
    } catch (err) {
      console.error("Error in subtask fetch:", err);
      // Continue with processing even if fetching subtasks fails
    }

    // Prepare context about existing subtasks to avoid duplicates
    let existingSubtasksContext = "";
    if (existingSubtasks.length > 0) {
      existingSubtasksContext = "\nExisting Student Subtasks (AVOID DUPLICATING THESE):\n";
      existingSubtasks.forEach((subtask, index) => {
        const phase = subtask.tasks?.phases?.name || "Unknown Phase";
        const task = subtask.tasks?.name || "Unknown Task";
        existingSubtasksContext += `${index + 1}. "${subtask.name}" (Status: ${subtask.status}) - Under ${phase} > ${task}\n`;
      });
    }

    // Prepare context about the roadmap structure
    let roadmapContext = "Project Phases and Tasks:\n";
    
    // Add phases and tasks to the context
    if (phases && phases.length > 0) {
      phases.forEach(phase => {
        roadmapContext += `\nPhase: ${phase.name} (ID: ${phase.id})\n`;
        
        // Find tasks for this phase
        const phaseTasks = tasks?.filter(task => task.phase_id === phase.id) || [];
        
        if (phaseTasks.length > 0) {
          phaseTasks.forEach(task => {
            roadmapContext += `  - Task: ${task.name} (ID: ${task.id})\n`;
          });
        } else {
          roadmapContext += `  (No tasks defined)\n`;
        }
      });
    } else {
      roadmapContext += "(No phases defined)\n";
    }

    // Construct the system prompt for transcript analysis
    const systemPrompt = `You are an advanced AI assistant specialized in analyzing meeting transcripts for academic counselors.
Your task is to extract actionable items and subtasks from the transcript, and organize them into a structured format.

Focus on identifying:
1. Clear action items that someone needs to complete
2. Deadlines or timeframes mentioned 
3. Assigned responsibilities (who needs to do what)
4. Deliverables or outcomes expected
5. Follow-up items for future meetings

Use the following project structure context to help categorize tasks:
${roadmapContext}

${existingSubtasksContext}

IMPORTANT: Do not extract subtasks that already exist in the student's list. The existing subtasks are provided above. Extract only new, unique subtasks that do not duplicate any existing ones. If you find an item similar to an existing subtask, it should be discarded.

For each identified subtask, provide:
- Description: A clear, concise description of what needs to be done
- Suggested phase: Identify which phase this best aligns with (use the phase ID)
- Suggested task: Identify which task this best aligns with (use the task ID)
- Owner: Who should complete this (if mentioned)
- Due date: When it should be completed (if mentioned)
- Priority: High/Medium/Low based on context and urgency
- Notes: Any additional context that helps understand the task

YOUR RESPONSE MUST BE VALID JSON with the following format:
{
  "tasks": [
    {
      "description": "Task description",
      "suggestedPhaseId": "phase-id or null",
      "suggestedPhaseName": "Phase name or null",
      "suggestedTaskId": "task-id or null", 
      "suggestedTaskName": "Task name or null",
      "owner": "Person responsible or null",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "High/Medium/Low",
      "notes": "Additional context"
    },
    ...
  ]
}

ONLY return valid JSON. Do not include any explanatory text before or after the JSON.`;

    // Call OpenAI API to analyze the transcript
    console.log("Calling OpenAI API...");
    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Here is the meeting transcript to analyze:\n\n${transcriptText}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      console.error("Error details:", apiError.stack || JSON.stringify(apiError));
      throw new Error(`OpenAI API error: ${apiError.message || 'Unknown OpenAI error'}`);
    }

    // Extract the generated tasks
    const responseContent = response.choices[0]?.message?.content || "{}";
    console.log("OpenAI response received", responseContent.substring(0, 100) + "...");
    
    let extractedTasks;
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      console.log("Successfully parsed JSON response");
      extractedTasks = parsedResponse.tasks || [];
      console.log(`Found ${extractedTasks.length} tasks in response`);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw response:", responseContent);
      throw new Error(`Failed to parse AI response: ${parseError.message}, raw response: ${responseContent.substring(0, 200)}...`);
    }
    
    // Return the extracted tasks
    const responseObj = { 
      extractedTasks,
      phaseOptions: phases || [],
      taskOptions: tasks || []
    };
    
    console.log(`Sending response with ${extractedTasks.length} tasks`);
    
    return new Response(
      JSON.stringify(responseObj),
      {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        }
      }
    );
  } catch (error: any) {
    console.error("Error in process-transcript function:", error);
    console.error("Error stack:", error.stack || "No stack trace available");
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process transcript",
        details: error.stack || JSON.stringify(error),
        errorType: error.constructor.name
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