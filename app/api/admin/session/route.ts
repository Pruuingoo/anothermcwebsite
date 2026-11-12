import { createHash } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function POST(request:NextRequest){
 const actor=await requireAdmin();if(!actor)return NextResponse.json({error:'Unauthorized'},{status:401});
 try {
  const auth=await createClient();const {data:{session}}=await auth.auth.getSession();
  if(!session?.access_token)return NextResponse.json({error:'Session unavailable'},{status:401});
  const hash=createHash('sha256').update(session.access_token).digest('hex');
  const forwarded=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const vercel=request.headers.get('x-vercel-ip-country-region');
  const payload={user_id:actor.id,session_hash:hash,ip_address:forwarded||null,country:request.headers.get('x-vercel-ip-country')||null,region:vercel||null,city:request.headers.get('x-vercel-ip-city')||null,user_agent:request.headers.get('user-agent')?.slice(0,500)||null,last_seen_at:new Date().toISOString()};
  const admin=createAdminClient();
  const {error}=await admin.from('admin_sessions').upsert(payload,{onConflict:'user_id,session_hash'});
  if(error)throw error;
  await admin.from('admin_members').update({accepted_at:new Date().toISOString()}).eq('user_id',actor.id).is('accepted_at',null);
  return NextResponse.json({success:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Admin session audit failed:',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'Could not record session'},{status:500})}
}

export async function GET(){
 const actor=await requireAdmin(['main','deputy']);if(!actor)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{const {data,error}=await createAdminClient().from('admin_sessions').select('id,user_id,ip_address,country,region,city,user_agent,first_seen_at,last_seen_at').order('last_seen_at',{ascending:false}).limit(500);if(error)throw error;return NextResponse.json({data:data||[]},{headers:{'Cache-Control':'no-store'}})}
 catch(e){console.error('Admin session list failed:',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'Could not load admin sessions'},{status:500})}
}
