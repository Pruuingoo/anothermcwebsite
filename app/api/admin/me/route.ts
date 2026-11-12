import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/auth";
export async function GET(){const admin=await getAdminContext();if(!admin)return NextResponse.json({error:"Unauthorized"},{status:401});return NextResponse.json({admin},{headers:{"Cache-Control":"no-store"}})}
