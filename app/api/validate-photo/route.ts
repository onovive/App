import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { Database } from '@/lib/types/database'

type Clue = Database['public']['Tables']['clues']['Row']

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(request: NextRequest) {
  try {
    const { photoUrl, clueId, huntId, userId } = await request.json()

    if (!photoUrl || !clueId || !huntId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Fetch clue criteria
    const { data: clue, error: clueError } = await supabase
      .from('clues')
      .select('clue_text, correct_answer_criteria')
      .eq('id', clueId)
      .single<Pick<Clue, 'clue_text' | 'correct_answer_criteria'>>()

    if (clueError || !clue) {
      return NextResponse.json({ error: 'Clue not found' }, { status: 404 })
    }

    // If no OpenAI API key, auto-approve
    if (!openai) {
      console.log('No OpenAI API key - auto-approving photo')
      return await saveAndRespond(supabase, userId, huntId, clueId, true, 'auto-approved: no API key')
    }

    // Try AI validation — auto-approve on ANY failure so players aren't penalized
    let isCorrect = true
    let rawResponse = ''

    try {
      // Build prompt
      const criteria = clue.correct_answer_criteria
      const criteriaText = (typeof criteria === 'string' && criteria) ? criteria : clue.clue_text

      const prompt = `Sei un validatore di foto per una caccia al tesoro. Il giocatore deve trovare e fotografare l'oggetto descritto.

INDIZIO: ${clue.clue_text}
CRITERIO: ${criteriaText}

Rispondi "giusta" se la foto mostra l'oggetto descritto (anche parzialmente o di angolo).
Rispondi "sbagliata" se la foto chiaramente NON contiene l'oggetto descritto.

Sii giusto: accetta se l'oggetto è visibile. Rifiuta solo se l'oggetto è completamente assente o la foto mostra qualcosa di non correlato.

Rispondi con UNA SOLA parola: giusta o sbagliata`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: photoUrl },
              },
            ],
          },
        ],
      })

      rawResponse = (response.choices[0]?.message?.content || '').trim().toLowerCase()
      console.log('OpenAI raw response:', rawResponse, 'for clue:', clue.clue_text)

      // Check response
      const hasNegative = ['sbagliata', 'incorrect', 'wrong'].some(s => rawResponse.includes(s))
      const hasPositive = ['giusta', 'correct', 'right'].some(s => rawResponse.includes(s))

      if (hasNegative && !hasPositive) {
        isCorrect = false
      } else if (hasPositive && !hasNegative) {
        isCorrect = true
      } else {
        // Ambiguous or unclear — default to correct
        isCorrect = true
      }
    } catch (aiError: any) {
      // AI failed entirely — auto-approve so players aren't penalized
      console.error('AI validation failed, auto-approving:', aiError.message)
      isCorrect = true
      rawResponse = `auto-approved: ${aiError.message}`
    }

    return await saveAndRespond(supabase, userId, huntId, clueId, isCorrect, rawResponse)
  } catch (error) {
    console.error('Photo validation critical error:', error)
    return NextResponse.json(
      { is_correct: true, error: 'Validation error, auto-approved' },
      { status: 200 }
    )
  }
}

async function saveAndRespond(
  supabase: any,
  userId: string,
  huntId: string,
  clueId: string,
  isCorrect: boolean,
  rawResponse: string,
) {
  const result = { is_correct: isCorrect, raw_response: rawResponse }

  // ALWAYS update the DB
  const { error: updateError } = await (supabase as any)
    .from('user_clue_submissions')
    .update({
      is_correct: isCorrect,
      ai_validation_result: result,
    })
    .eq('user_id', userId)
    .eq('hunt_id', huntId)
    .eq('clue_id', clueId)

  if (updateError) {
    console.error('Error updating submission:', updateError)
  }

  // Update correct clues count
  if (isCorrect) {
    const { data: participant } = await supabase
      .from('hunt_participants')
      .select('correct_clues')
      .eq('hunt_id', huntId)
      .eq('user_id', userId)
      .single()

    if (participant) {
      await (supabase as any)
        .from('hunt_participants')
        .update({ correct_clues: (participant.correct_clues || 0) + 1 })
        .eq('hunt_id', huntId)
        .eq('user_id', userId)
    }
  }

  return NextResponse.json(result)
}
