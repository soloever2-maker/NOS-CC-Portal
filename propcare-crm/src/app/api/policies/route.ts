export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── GET — list all policies ───────────────────────────────────────────────────
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
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// ── POST — upload a policy file ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only admins can upload
    const { data: profile } = await supabase
      .from("users").select("role").eq("supabase_id", user.id).single();
    const isAdmin = profile && ["ADMIN","SUPER_ADMIN","MANAGER"].includes(profile.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const title    = formData.get("title") as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: "file and title are required" }, { status: 400 });
    }

    // ── Extract text from the file ────────────────────────────────────────────
    let content = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      content = await file.text();

    } else if (fileName.endsWith(".pdf")) {
      // استخدم Supabase edge function أو نص fallback
      // بما إن مفيش pdf-parse في environment دا، نحفظ placeholder والأدمن يكتب النص يدويا
      content = (formData.get("content") as string | null) ?? "";
      if (!content) {
        return NextResponse.json({
          error: "PDF detected — please paste the document text in the 'content' field",
          needsContent: true,
        }, { status: 422 });
      }

    } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      content = (formData.get("content") as string | null) ?? "";
      if (!content) {
        return NextResponse.json({
          error: "Word doc detected — please paste the document text in the 'content' field",
          needsContent: true,
        }, { status: 422 });
      }

    } else {
      // حاول تقراه كـ text
      try { content = await file.text(); } catch { content = ""; }
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    // ── Upload file to Supabase Storage ───────────────────────────────────────
    const storagePath = `policies/${Date.now()}_${file.name}`;
    const { error: storageError } = await supabase.storage
      .from("policies")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    let fileUrl: string | null = null;
    if (!storageError) {
      const { data: urlData } = supabase.storage
        .from("policies").getPublicUrl(storagePath);
      fileUrl = urlData.publicUrl;
    }

    // ── Save to DB ────────────────────────────────────────────────────────────
    const { data, error } = await supabase.from("policies").insert({
      id:        crypto.randomUUID(),
      title:     title.trim(),
      content:   content.trim(),
      file_name: file.name,
      file_url:  fileUrl,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// ── DELETE — remove a policy ──────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users").select("role").eq("supabase_id", user.id).single();
    const isAdmin = profile && ["ADMIN","SUPER_ADMIN","MANAGER"].includes(profile.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("policies").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
