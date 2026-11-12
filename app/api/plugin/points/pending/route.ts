import { timingSafeEqual } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime="nodejs";
function authorized(value:string|null){const expected=process.env.MINECRAFT_SERVER_PLUGIN_API_KEY;if(!value||!expected)return false;const supplied=Buffer.from(value);const secret=Buffer.from(`Bearer ${expected}`);return supplied.length===secret.length&&timingSafeEqual(supplied,secret)}
export async function GET(request:NextRequest){if(!authorized(request.headers.get('authorization')))return NextResponse.json({error:'Unauthorized'},{status:401});try{const admin=createAdminClient();const {data,error}=await admin.rpc('claim_plugin_points_orders');if(error)throw error;return NextResponse.json({orders:(data||[]).map((order:{id:string;minecraft_username:string;points_amount:number})=>({id:order.id,username:order.minecraft_username,points:order.points_amount}))},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error('Plugin points poll failed:',e instanceof Error?e.message:'unknown');return NextResponse.json({error:'Queue unavailable'},{status:503})}}
