import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

type InvitePayload = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  adminNotes?: string;
  professionalId?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Supabase function is not configured" }, 500);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Authorization is required" }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  });
  const { data: caller, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller.user) return json({ error: "Invalid session" }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_role")
    .eq("id", caller.user.id)
    .single();
  if (profileError || adminProfile?.account_role !== "admin") {
    return json({ error: "Only Admin accounts can invite Professionals" }, 403);
  }

  let payload: InvitePayload;
  try {
    payload = (await request.json()) as InvitePayload;
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const phone = payload.phone?.trim() ?? "";
  const location = payload.location?.trim() ?? "";
  const adminNotes = payload.adminNotes?.trim() ?? "";
  if (!name || !email || !phone || !location || !payload.professionalId) {
    return json({ error: "Name, email, phone, location, and an id are required" }, 400);
  }

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { data: { display_name: name } }
  );
  if (inviteError || !invited.user) {
    return json({ error: inviteError?.message ?? "Could not invite Professional" }, 400);
  }

  const { error: updateProfileError } = await adminClient
    .from("profiles")
    .upsert({
      id: invited.user.id,
      display_name: name,
      email,
      account_role: "professional"
    });
  if (updateProfileError) {
    await adminClient.auth.admin.deleteUser(invited.user.id);
    return json({ error: updateProfileError.message }, 500);
  }

  const { data: professional, error: professionalError } = await adminClient
    .from("professionals")
    .insert({
      id: payload.professionalId,
      profile_id: invited.user.id,
      phone,
      location,
      admin_notes: adminNotes
    })
    .select("id")
    .single();
  if (professionalError || !professional) {
    await adminClient.auth.admin.deleteUser(invited.user.id);
    return json({ error: professionalError?.message ?? "Could not create Professional record" }, 500);
  }

  return json({ professionalId: professional.id });
});
