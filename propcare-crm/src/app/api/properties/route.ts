export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreatePropertySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let query = supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,project.ilike.%${search}%`);
    if (type && type !== "ALL") query = query.eq("type", type);
    if (status && status !== "ALL") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const rawBody = await req.json();
    const parseResult = CreatePropertySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parseResult.data;

    const { data, error } = await supabase
      .from("properties")
      .insert({
        id: crypto.randomUUID(),
        code: body.code,
        name: body.name,
        type: body.type,
        status: body.status ?? "AVAILABLE",
        project: body.project || null,
        building: body.building || null,
        floor: body.floor ?? null,
        unit: body.unit || null,
        area: body.area ?? null,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        price: body.price ?? null,
        address: body.address || null,
        city: body.city || null,
        description: body.description || null,
        images: [],
        amenities: body.amenities ?? [],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create property" }, { status: 500 });
  }
}
