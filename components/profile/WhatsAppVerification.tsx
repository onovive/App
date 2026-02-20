'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const COUNTRY_CODES = [
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+92', country: 'PK', flag: '🇵🇰' },
]

function extractCountryCode(phone: string | null): { countryCode: string; number: string } {
  if (!phone) return { countryCode: '+39', number: '' }
  for (const c of COUNTRY_CODES) {
    if (phone.startsWith(c.code)) {
      return { countryCode: c.code, number: phone.replace(c.code, '') }
    }
  }
  return { countryCode: '+39', number: phone.replace(/^\+\d+/, '') }
}

interface WhatsAppVerificationProps {
  userId: string
  currentPhoneNumber: string | null
  isVerified: boolean
}

type Step = 'display' | 'edit' | 'verify'

export default function WhatsAppVerification({
  userId,
  currentPhoneNumber,
  isVerified,
}: WhatsAppVerificationProps) {
  const extracted = extractCountryCode(currentPhoneNumber)
  const [step, setStep] = useState<Step>('display')
  const [countryCode, setCountryCode] = useState(extracted.countryCode)
  const [phoneNumber, setPhoneNumber] = useState(extracted.number)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(isVerified)
  const supabase = createClient()

  const handleSendOtp = async () => {
    setIsLoading(true)
    setError('')

    try {
      // First update phone number in profile
      const fullPhoneNumber = countryCode + phoneNumber
      await (supabase as any)
        .from('profiles')
        .update({ phone_number: fullPhoneNumber })
        .eq('id', userId)

      // Send OTP
      const response = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Errore nell\'invio del codice')
        setIsLoading(false)
        return
      }

      setStep('verify')
    } catch {
      setError('Errore di connessione. Riprova.')
    }

    setIsLoading(false)
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true)
    setError('')

    try {
      const fullPhoneNumber = countryCode + phoneNumber
      const response = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: fullPhoneNumber, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Codice non valido')
        setIsLoading(false)
        return
      }

      // Update local state and profile
      await (supabase as any)
        .from('profiles')
        .update({ whatsapp_verified: true })
        .eq('id', userId)

      setVerified(true)
      setStep('display')
    } catch {
      setError('Errore di connessione. Riprova.')
    }

    setIsLoading(false)
  }

  const handleEdit = () => {
    setStep('edit')
    setError('')
  }

  const handleCancel = () => {
    setStep('display')
    const extracted = extractCountryCode(currentPhoneNumber)
    setCountryCode(extracted.countryCode)
    setPhoneNumber(extracted.number)
    setOtp('')
    setError('')
  }

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-base font-bold mb-[15px] text-[#333]">
        Contatto
      </h3>

      {error && (
        <div className="bg-[#F8D7DA] border border-[#F5C6CB] text-[#721C24] px-3 py-2 mb-3 rounded text-sm">
          {error}
        </div>
      )}

      {step === 'display' && (
        <div>
          {verified && currentPhoneNumber ? (
            <div className="flex items-center justify-between p-3 bg-[#E6F7E6] border border-[#4CAF50] rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#4CAF50]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-[#155724]">
                  {currentPhoneNumber}
                </span>
              </div>
              <button
                onClick={handleEdit}
                className="text-xs text-[#666] hover:text-[#333] underline"
              >
                Modifica
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#666] mb-3">
                Aggiungi il tuo numero per ricevere notifiche sulle cacce al tesoro.
              </p>
              <button
                onClick={handleEdit}
                className="w-full px-4 py-3 bg-gradient-to-b from-[#25D366] to-[#20bd5a] text-white border border-[#1da851] rounded-lg text-sm font-medium shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:from-[#2ae573] hover:to-[#25D366] transition-all"
              >
                Aggiungi Numero
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'edit' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm text-[#666] mb-2">
              Numero di telefono
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-[90px] px-2 py-2 text-sm border border-[#C0C0C0] bg-[#F5F5F5] rounded text-[#666] focus:border-[#888] focus:outline-none cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Numero di telefono"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3 py-2 text-sm border border-[#C0C0C0] bg-white rounded focus:border-[#888] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-[#F5F5F5] text-[#666] border border-[#C0C0C0] rounded text-sm font-medium hover:bg-[#E8E8E8]"
            >
              Annulla
            </button>
            <button
              onClick={handleSendOtp}
              disabled={isLoading || phoneNumber.length < 9}
              className="flex-1 px-4 py-2 bg-gradient-to-b from-[#25D366] to-[#20bd5a] text-white border border-[#1da851] rounded text-sm font-medium shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:from-[#2ae573] hover:to-[#25D366] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Invio...' : 'Invia Codice'}
            </button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm text-[#666] mb-2">
              Inserisci il codice ricevuto via SMS
            </label>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 text-xl text-center tracking-[0.3em] border border-[#C0C0C0] bg-white rounded focus:border-[#888] focus:outline-none"
            />
            <p className="text-xs text-[#888] mt-2 text-center">
              Codice inviato a {countryCode} {phoneNumber}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-[#F5F5F5] text-[#666] border border-[#C0C0C0] rounded text-sm font-medium hover:bg-[#E8E8E8]"
            >
              Annulla
            </button>
            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
              className="flex-1 px-4 py-2 bg-gradient-to-b from-[#25D366] to-[#20bd5a] text-white border border-[#1da851] rounded text-sm font-medium shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:from-[#2ae573] hover:to-[#25D366] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifica...' : 'Verifica'}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-[#888] mt-3">
        Riceverai promemoria prima delle cacce e notifiche sui risultati.
      </p>
    </div>
  )
}
