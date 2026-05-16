import { NextResponse } from 'next/server';
import { authedWrite, requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { requireRowOwnership } from '@/lib/auth-guards';

const BUCKET = 'crm-documents';

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const form = await req.formData();
  const file = form.get('file');
  const operator_id = form.get('operator_id') || null;
  const partner_id = form.get('partner_id') || null;
  const kind = form.get('kind') || 'OTHER';
  const externalUrl = form.get('external_url');

  if (!operator_id && !partner_id) {
    return NextResponse.json({ error: 'operator_id or partner_id required' }, { status: 400 });
  }

  const supa = auth.supa;
  const parent = { operator_id, partner_id };
  const folder = operator_id ? `op/${operator_id}` : `partner/${partner_id}`;

  // External link mode (no file)
  if (!file && externalUrl) {
    const name = form.get('name') || externalUrl;
    const { data, error } = await supa
      .from('documents')
      .insert({ ...parent, name, kind, external_url: externalUrl, actor_id: auth.actor })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ document: data });
  }

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supa.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await supa
    .from('documents')
    .insert({ ...parent, name: file.name, kind, storage_path: path, actor_id: auth.actor })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ document: data });
}

export async function DELETE(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { id } = await req.json();
  const supa = auth.supa;

  // Enforce ownership: only the uploader (or admin) can delete a document.
  let doc;
  try {
    doc = await requireRowOwnership({
      table: 'documents',
      id,
      actorId: auth.actor,
      ownerColumn: 'actor_id',
      adminProfile: auth.profile,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  if (doc?.storage_path) {
    await supa.storage.from(BUCKET).remove([doc.storage_path]);
  }
  const { error } = await supa.from('documents').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Generate a signed URL for a private file
export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
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
