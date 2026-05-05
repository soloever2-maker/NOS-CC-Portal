export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("policies")
      .select("id, title, file_name, file_url, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[policies GET]", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file     = formData.get("file")    as File   | null;
    const title    = formData.get("title")   as string | null;
    const content  = formData.get("content") as string | null;

    if (!file || !title?.trim()) {
      return NextResponse.json({ error: "file and title are required" }, { status: 400 });
    }

    // ── Extract text ──────────────────────────────────────────────────────────
    let extractedContent = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      extractedContent = await file.text();
    } else {
      // PDF / Word — نستخدم النص اللي الأدمن لصقه
      extractedContent = content?.trim() ?? "";
    }

    if (!extractedContent) {
      return NextResponse.json({
        error: "لم يتم استخراج أي نص — يرجى لصق نص المستند في الحقل المخصص",
        needsContent: true,
      }, { status: 422 });
    }

    // ── Upload to Storage (اختياري — لو فشل منحوشش) ─────────────────────────
    let fileUrl: string | null = null;
    try {
      const storagePath = `policies/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from("policies")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (!storageError) {
        const { data: urlData } = supabase.storage
          .from("policies").getPublicUrl(storagePath);
        fileUrl = urlData.publicUrl;
      } else {
        console.warn("[policies POST] storage skip:", storageError.message);
      }
    } catch (storageErr) {
      console.warn("[policies POST] storage exception:", storageErr);
    }

    // ── Save to DB ────────────────────────────────────────────────────────────
    const { data, error } = await supabase.from("policies").insert({
      id:        crypto.randomUUID(),
      title:     title.trim(),
      content:   extractedContent,
      file_name: file.name,
      file_url:  fileUrl,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (err) {
    console.error("[policies POST]", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("policies").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[policies DELETE]", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
