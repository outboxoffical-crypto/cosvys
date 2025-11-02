import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
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

    const { projectId, companyName }: ReminderRequest = await req.json();

    // Fetch project details
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    const message = `Hello ${project.customer_name}, 
We noticed you haven't responded to your quotation (₹${project.quotation_value.toLocaleString()}).
Could you please confirm or share the reason for not proceeding?
You can reply directly to this message to send us your feedback.
Thank you, 
${companyName}`;

    // Send SMS using Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

    console.log('Twilio Configuration Check:');
    console.log('- Account SID exists:', !!twilioAccountSid);
    console.log('- Auth Token exists:', !!twilioAuthToken);
    console.log('- Phone Number:', twilioPhone);
    console.log('- Recipient:', `+91${project.phone}`);

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhone) {
      throw new Error('Missing Twilio credentials. Please check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets.');
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', `+91${project.phone}`);
    formData.append('From', twilioPhone);
    formData.append('Body', message);

    console.log('Sending SMS via Twilio...');

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await twilioResponse.text();
    console.log('Twilio Response Status:', twilioResponse.status);
    console.log('Twilio Response Body:', responseText);

    if (!twilioResponse.ok) {
      throw new Error(`Twilio API error (${twilioResponse.status}): ${responseText}`);
    }

    // Update reminder_sent status
    await supabaseClient
      .from('projects')
      .update({ reminder_sent: true })
      .eq('id', projectId);

    // Log activity
    await supabaseClient
      .from('project_activity_log')
      .insert({
        project_id: projectId,
        activity_type: 'reminder_sent',
        activity_message: `Reminder SMS sent to ${project.customer_name} at ${project.phone}`,
      });

    console.log('Reminder SMS sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Reminder SMS sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending reminder SMS:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});