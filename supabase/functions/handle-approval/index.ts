import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const action = url.searchParams.get('action');

  if (!token || action !== 'approve') {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the approval token
    const { data: approvalToken, error: tokenError } = await supabaseClient
      .from('approval_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !approvalToken) {
      console.error('Invalid token:', token);
      return new Response(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #ef4444;">✗ Invalid Approval Link</h1>
            <p>This approval link is invalid or has expired.</p>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    // Check if token has already been used
    if (approvalToken.used_at) {
      console.log(`Token already used at ${approvalToken.used_at}`);
      return new Response(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #f59e0b;">⚠ Already Approved</h1>
            <p>This quotation has already been approved.</p>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    // Check if token has expired
    const expiresAt = new Date(approvalToken.expires_at);
    if (expiresAt < new Date()) {
      console.log(`Token expired at ${approvalToken.expires_at}`);
      return new Response(
        `<html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #ef4444;">✗ Link Expired</h1>
            <p>This approval link has expired. Please contact the dealer for a new link.</p>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    // Update project approval status
    await supabaseClient
      .from('projects')
      .update({ approval_status: 'Approved' })
      .eq('id', approvalToken.project_id);

    // Mark token as used
    await supabaseClient
      .from('approval_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Log activity
    await supabaseClient
      .from('project_activity_log')
      .insert({
        project_id: approvalToken.project_id,
        activity_type: 'approved',
        activity_message: 'Customer approved the quotation',
      });

    console.log(`Project ${approvalToken.project_id} approved via secure token`);

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
