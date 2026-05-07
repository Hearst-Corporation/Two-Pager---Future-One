import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

const BUCKET = 'crm-documents';

export async function POST(req) {
  const form = await req.formData();
  const file = form.get('file');
  const operator_id = form.get('operator_id');
  const kind = form.get('kind') || 'OTHER';
  const externalUrl = form.get('external_url');

  if (!operator_id) return NextResponse.json({ error: 'Missing operator_id' }, { status: 400 });

  const supa = getAdminClient();

  // External link mode (no file)
  if (!file && externalUrl) {
    const name = form.get('name') || externalUrl;
    const { data, error } = await supa
      .from('documents')
      .insert({ operator_id, name, kind, external_url: externalUrl })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ document: data });
  }

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${operator_id}/${Date.now()}_${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supa.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await supa
    .from('documents')
    .insert({ operator_id, name: file.name, kind, storage_path: path })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ document: data });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const supa = getAdminClient();
  const { data: doc } = await supa.from('documents').select('*').eq('id', id).single();
  if (doc?.storage_path) {
    await supa.storage.from(BUCKET).remove([doc.storage_path]);
  }
  const { error } = await supa.from('documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Generate a signed URL for a private file
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const supa = getAdminClient();
  const { data: doc } = await supa.from('documents').select('*').eq('id', id).single();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (doc.external_url) return NextResponse.json({ url: doc.external_url });
  if (!doc.storage_path) return NextResponse.json({ error: 'No file' }, { status: 404 });
  const { data, error } = await supa.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60 * 10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
