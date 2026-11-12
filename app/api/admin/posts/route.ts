import { NextRequest,NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";
import { renderSafeMarkdown } from "@/lib/admin/markdown";

const slugify=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
export async function GET(){const actor=await requireAdmin();if(!actor)return NextResponse.json({error:'Unauthorized'},{status:401});const admin=createAdminClient();const {data,error}=await admin.from('posts').select('id,title,slug,source_path,excerpt,cover_url,category,published_at,is_published,content_markdown').order('published_at',{ascending:false}).limit(300);if(error)return NextResponse.json({error:'Could not load posts'},{status:500});return NextResponse.json({data},{headers:{'Cache-Control':'no-store'}})}
export async function POST(request:NextRequest){
 const actor=await requireAdmin();if(!actor)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const body=await request.json();const action=body.action;
  const admin=createAdminClient();
  if(action==='delete'){
   if(typeof body.id!=='string')return NextResponse.json({error:'Post id required'},{status:400});
   const result=await admin.from('posts').delete().eq('id',body.id);if(result.error)throw result.error;
   await admin.from('admin_audit_log').insert({actor_id:actor.id,action:'delete_post',target_type:'post',target_id:body.id});return NextResponse.json({success:true});
  }
  const title=typeof body.title==='string'?body.title.trim():'';const slug=slugify(typeof body.slug==='string'&&body.slug.trim()?body.slug:title);const markdown=typeof body.contentMarkdown==='string'?body.contentMarkdown:'';const excerpt=typeof body.excerpt==='string'?body.excerpt.trim():'';const coverUrl=typeof body.coverUrl==='string'?body.coverUrl.trim():'';const category=typeof body.category==='string'?body.category.trim():'Minecraft Guides';const published=body.published===true;
  if(title.length<4||title.length>180||!slug||markdown.length<1||markdown.length>150000)return NextResponse.json({error:'Add a title and Markdown content (maximum 150,000 characters).'},{status:400});
  if(excerpt.length>600||!/^https:\/\//.test(coverUrl))return NextResponse.json({error:'Enter an excerpt up to 600 characters and an HTTPS preview image URL.'},{status:400});
  const contentHtml=await renderSafeMarkdown(markdown);const now=new Date().toISOString();const fields={title,slug,source_path:`/blog/${slug}`,excerpt,cover_url:coverUrl,category,published_at:published?(body.publishedAt||now):now,is_published:published,content_markdown:markdown,content_html:contentHtml,author_id:actor.id,updated_at:now};
  const query=typeof body.id==='string'?admin.from('posts').update(fields).eq('id',body.id):admin.from('posts').insert(fields);
  const result=await query.select('id,title,slug,source_path,is_published').single();if(result.error)throw result.error;
  await admin.from('admin_audit_log').insert({actor_id:actor.id,action:typeof body.id==='string'?'edit_post':'create_post',target_type:'post',target_id:result.data.id,details:{slug,published}});
  return NextResponse.json({success:true,data:result.data});
 }catch(error){console.error('Admin post save failed:',error instanceof Error?error.message:'unknown');return NextResponse.json({error:'Could not save post.'},{status:500})}
}
