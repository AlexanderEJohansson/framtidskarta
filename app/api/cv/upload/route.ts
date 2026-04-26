import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil uppladdad' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      return NextResponse.json({ error: 'Endast PDF, DOCX och TXT stöds' }, { status: 400 });
    }

    let text = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Dynamic import for pdf-parse
      const pdfParse = await import('pdf-parse');
      const buffer = Buffer.from(await file.arrayBuffer());
      const data = await (pdfParse as any)(buffer);
      text = data.text;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      // Dynamic import for mammoth
      const mammoth = await import('mammoth');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      // Plain text
      text = await file.text();
    }

    // Clean up the text
    text = text.replace(/\s+/g, ' ').trim();

    if (text.length < 50) {
      return NextResponse.json({ error: 'Kunde inte läsa filen. Försök med ett annat format.' }, { status: 422 });
    }

    // Optionally save to profile
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          cv_text: text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return NextResponse.json({ text, fileName: file.name });
  } catch (err) {
    console.error('CV upload error:', err);
    return NextResponse.json({ error: 'Kunde inte läsa filen' }, { status: 500 });
  }
}
