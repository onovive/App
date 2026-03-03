import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Database } from '@/lib/types/database'

type Clue = Database['public']['Tables']['clues']['Row']
type HuntParticipant = Database['public']['Tables']['hunt_participants']['Row']

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

    // If no Gemini API key, simulate validation
    if (!genAI) {
      console.log('No Gemini API key - simulating validation')
      const simulatedResult = {
        is_correct: Math.random() > 0.3, // 70% success rate
        confidence: Math.floor(Math.random() * 30) + 70,
        reasoning: 'Simulated validation (no Gemini API key configured)',
      }

      // Update submission with result
      await (supabase as any)
        .from('user_clue_submissions')
        .update({
          is_correct: simulatedResult.is_correct,
          ai_validation_result: simulatedResult,
        })
        .eq('user_id', userId)
        .eq('hunt_id', huntId)
        .eq('clue_id', clueId)

      // Update participant correct clues count
      if (simulatedResult.is_correct) {
        const { data: participant } = await supabase
          .from('hunt_participants')
          .select('correct_clues')
          .eq('hunt_id', huntId)
          .eq('user_id', userId)
          .single<Pick<HuntParticipant, 'correct_clues'>>()

        if (participant) {
          await (supabase as any)
            .from('hunt_participants')
            .update({
              correct_clues: (participant.correct_clues || 0) + 1,
            })
            .eq('hunt_id', huntId)
            .eq('user_id', userId)
        }
      }

      return NextResponse.json(simulatedResult)
    }

    // Fetch the image as base64
    const imageResponse = await fetch(photoUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // Determine mime type
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Create validation prompt
    const criteria = clue.correct_answer_criteria
    // Format criteria as plain text (avoid JSON.stringify adding extra quotes for strings)
    const criteriaText = typeof criteria === 'string' ? criteria : JSON.stringify(criteria)
    const prompt = `You are a system that validates photos for a scavenger hunt game.

CLUE
${clue.clue_text}

CRITERION
${criteriaText}

TASK
Decide whether the image satisfies the criterion.

RULES
- The image is "giusta" if it clearly shows what the clue or criterion describes, even partially.
- Be generous: if the main subject is recognizable and matches the clue, it is "giusta".
- The photo does NOT need to be high quality or perfectly framed.
- Only mark as "sbagliata" if the required object is clearly NOT present at all.
- If the object appears only inside a screen, display, printed image, or another photo → sbagliata.

OUTPUT
Reply with ONLY one word: giusta or sbagliata`

    // Call Gemini Vision API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result_response = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: contentType,
        },
      },
    ])

    const responseText = result_response.response.text().trim().toLowerCase()
    // Check if response contains "giusta" (more flexible than exact match)
    const isCorrect = responseText.includes('giusta') && !responseText.includes('sbagliata')
    const result = {
      is_correct: isCorrect,
      raw_response: responseText,
    }

    console.log('Photo validation result:', { clueText: clue.clue_text, criteria: criteriaText, responseText, isCorrect })

    // Update submission with validation result
    const { error: updateError } = await (supabase as any)
      .from('user_clue_submissions')
      .update({
        is_correct: result.is_correct,
        ai_validation_result: result,
      })
      .eq('user_id', userId)
      .eq('hunt_id', huntId)
      .eq('clue_id', clueId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
    }

    // Update participant's correct clues count
    if (result.is_correct) {
      const { data: participant } = await supabase
        .from('hunt_participants')
        .select('correct_clues')
        .eq('hunt_id', huntId)
        .eq('user_id', userId)
        .single<Pick<HuntParticipant, 'correct_clues'>>()

      if (participant) {
        await (supabase as any)
          .from('hunt_participants')
          .update({
            correct_clues: (participant.correct_clues || 0) + 1,
          })
          .eq('hunt_id', huntId)
          .eq('user_id', userId)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Photo validation error:', error)
    return NextResponse.json(
      { error: 'Validation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
