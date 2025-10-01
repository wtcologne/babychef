import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { VISION_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { ageRange, imagePublicUrl, storagePath } = await req.json();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.6,
    messages: [
      { role: 'system', content: 'Antworte ausschließlich in gültigem JSON.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_PROMPT(ageRange) },
          { type: 'image_url', image_url: { url: imagePublicUrl } }
        ] as any
      }
    ]
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { return NextResponse.json({ error: 'parse_error', raw }, { status: 422 }); }

  await supabase.from('fridge_photos').insert({
    user_id: user.id,
    storage_path: storagePath,
    detected_items: parsed.detected_items
  });

  return NextResponse.json({ proposals: parsed.recipes, detected: parsed.detected_items });
}
