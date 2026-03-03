import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Database } from '@/lib/types/database'

type Clue = Database['public']['Tables']['clues']['Row']

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
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

    // If no Gemini API key, auto-approve
    if (!genAI) {
      console.log('No Gemini API key - auto-approving photo')
      return await saveAndRespond(supabase, userId, huntId, clueId, true, 'auto-approved: no API key')
    }

    // Try AI validation — auto-approve on ANY failure so players aren't penalized
    let isCorrect = true
    let rawResponse = ''

    try {
      // Fetch the image as base64
      const imageResponse = await fetch(photoUrl)
      if (!imageResponse.ok) {
        throw new Error(`Image fetch failed: ${imageResponse.status}`)
      }
      const imageBuffer = await imageResponse.arrayBuffer()
      const imageBase64 = Buffer.from(imageBuffer).toString('base64')
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

      // Build prompt
      const criteria = clue.correct_answer_criteria
      const criteriaText = (typeof criteria === 'string' && criteria) ? criteria : clue.clue_text
      const prompt = `You validate photos for a scavenger hunt. The player must find and photograph the item described.

CLUE: ${clue.clue_text}
CRITERION: ${criteriaText}

Reply "giusta" if the photo shows the described item (even partially or at an angle).
Reply "sbagliata" if the photo clearly does NOT contain the described item.

Be fair: accept if the item is visible. Reject if the item is completely absent or the photo shows something unrelated.

Reply with ONLY one word: giusta or sbagliata`

      // Try models in order (fallback chain)
      const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash']
      let aiResult = null

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName })
          aiResult = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: imageBase64,
                mimeType: contentType,
              },
            },
          ])
          console.log('Gemini model used successfully:', modelName)
          break
        } catch (modelError: any) {
          console.warn(`Model ${modelName} failed:`, modelError.message)
          continue
        }
      }

      if (!aiResult) {
        throw new Error('All Gemini models failed')
      }

      rawResponse = aiResult.response.text().trim().toLowerCase()
      console.log('Gemini raw response:', rawResponse, 'for clue:', clue.clue_text)

      // Trust the AI response — check both positive and negative signals
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
