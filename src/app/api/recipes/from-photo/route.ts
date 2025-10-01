import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { VISION_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { ageRange, imagePublicUrl, storagePath, userId } = await req.json();
    
    console.log('Vision API: Processing photo', { ageRange, imagePublicUrl, storagePath, userId });
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id_required' }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Get a signed URL that works for OpenAI
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('fridge-photos')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to create signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Failed to access image' }, { status: 500 });
    }

    console.log('Using signed URL for OpenAI:', signedUrlData.signedUrl);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      messages: [
        { role: 'system', content: 'Antworte ausschließlich in gültigem JSON.' },
              {
                role: 'user',
                content: [
                  { type: 'text', text: VISION_PROMPT(ageRange) },
                  { type: 'image_url', image_url: { url: signedUrlData.signedUrl } }
                ]
              }
      ]
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    console.log('OpenAI Vision response:', raw);
    
    let parsed: unknown;
    try { 
      parsed = JSON.parse(raw); 
    } catch (parseError) { 
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'parse_error', raw }, { status: 422 }); 
    }

    const parsedData = parsed as { detected_items: unknown; recipes: unknown };
    
    console.log('Parsed data:', parsedData);
    
    await supabase.from('fridge_photos').insert({
      user_id: userId,
      storage_path: storagePath,
      detected_items: parsedData.detected_items
    });

    return NextResponse.json({ proposals: parsedData.recipes, detected: parsedData.detected_items });
  } catch (error: unknown) {
    console.error('Vision API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
