export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let query = supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,phone2.ilike.%${search}%,email.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const code = generateCode("CLT");

    const { data, error } = await supabase.from("clients").insert({
      id: crypto.randomUUID(), code,
      name: body.name,
      email: body.email || null,
      phone: body.phone,
      phone2: body.phone2 || null,
      whatsapp: body.whatsapp || null,
      referral_number: body.referralNumber || null,
      nationality: body.nationality || null,
      id_number: body.idNumber || null,
      address: body.address || null,
      city: body.city || null,
      notes: body.notes || null,
      tags: body.tags ?? [],
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 });
  }
}
