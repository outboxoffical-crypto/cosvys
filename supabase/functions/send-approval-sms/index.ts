import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  projectId: string;
  companyName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { projectId, companyName }: ApprovalRequest = await req.json();

    console.log('Simulating approval for project:', projectId);

    // Fetch project details
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Update project status to Approved
    const { error: updateError } = await supabaseClient
      .from('projects')
      .update({ 
        approval_status: 'Approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project status:', updateError);
      throw new Error('Failed to update project status');
    }

    // Log activity
    await supabaseClient
      .from('project_activity_log')
      .insert({
        project_id: projectId,
        activity_type: 'approval_simulated',
        activity_message: `Customer approval simulated for ${project.customer_name}`,
      });

    console.log('Project status updated to Approved successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Customer approval simulated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending approval SMS:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});