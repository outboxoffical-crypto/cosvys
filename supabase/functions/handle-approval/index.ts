import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('project');
  const action = url.searchParams.get('action');

  if (!projectId || action !== 'approve') {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update project approval status
    await supabaseClient
      .from('projects')
      .update({ approval_status: 'Approved' })
      .eq('id', projectId);

    // Log activity
    await supabaseClient
      .from('project_activity_log')
      .insert({
        project_id: projectId,
        activity_type: 'approved',
        activity_message: 'Customer approved the quotation',
      });

    console.log(`Project ${projectId} approved`);

    return new Response(
      `<html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #22c55e;">✓ Quotation Approved!</h1>
          <p>Thank you for approving the quotation. We will contact you soon.</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error handling approval:', error);
    return new Response('Error processing approval', { status: 500 });
  }
});