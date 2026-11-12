import { NextRequest,NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { renderSafeMarkdown } from "@/lib/admin/markdown";
export async function POST(request:NextRequest){if(!await requireAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});try{const body=await request.json();const markdown=typeof body.markdown==='string'?body.markdown:'';if(markdown.length>150000)return NextResponse.json({error:'Markdown is too long.'},{status:400});return NextResponse.json({html:await renderSafeMarkdown(markdown)})}catch{return NextResponse.json({error:'Could not render preview.'},{status:400})}}
