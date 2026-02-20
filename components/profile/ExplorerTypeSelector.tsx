'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const EXPLORER_TYPES = [
  { type: 'Urban', label: 'ESPLORATORE IMPULSIVO', color: 'bg-[#4CAF50]' },
  { type: 'Trail', label: 'CARTOGRAFO SELVAGGIO', color: 'bg-[#2196F3]' },
  { type: 'Mystery', label: 'RICERCATORE RANDAGIO', color: 'bg-[#FF9800]' },
  { type: 'Geo', label: 'ESPLORATORE LATERALE', color: 'bg-[#9C27B0]' },
  { type: 'Riddle', label: 'DETECTIVE CREPUSCOLARE', color: 'bg-[#F44336]' },
  { type: 'Digital', label: 'INVESTIGATORE VISIONARIO', color: 'bg-[#00BCD4]' },
]

const explorerTypeLabels: Record<string, string> = {
  Urban: 'ESPLORATORE IMPULSIVO',
  Trail: 'CARTOGRAFO SELVAGGIO',
  Mystery: 'RICERCATORE RANDAGIO',
  Geo: 'ESPLORATORE LATERALE',
  Riddle: 'DETECTIVE CREPUSCOLARE',
  Digital: 'INVESTIGATORE VISIONARIO',
}

const explorerTypeDisplayColors: Record<string, { bg: string; hoverBg: string; text: string; border: string }> = {
  Urban: { bg: 'bg-[#E8F5E9]', hoverBg: 'hover:bg-[#C8E6C9]', text: 'text-[#2E7D32]', border: 'border-[#A5D6A7]' },
  Trail: { bg: 'bg-[#E3F2FD]', hoverBg: 'hover:bg-[#BBDEFB]', text: 'text-[#1565C0]', border: 'border-[#90CAF9]' },
  Mystery: { bg: 'bg-[#FFF3E0]', hoverBg: 'hover:bg-[#FFE0B2]', text: 'text-[#E65100]', border: 'border-[#FFCC80]' },
  Geo: { bg: 'bg-[#F3E5F5]', hoverBg: 'hover:bg-[#E1BEE7]', text: 'text-[#6A1B9A]', border: 'border-[#CE93D8]' },
  Riddle: { bg: 'bg-[#FFEBEE]', hoverBg: 'hover:bg-[#FFCDD2]', text: 'text-[#C62828]', border: 'border-[#EF9A9A]' },
  Digital: { bg: 'bg-[#E0F7FA]', hoverBg: 'hover:bg-[#B2EBF2]', text: 'text-[#00838F]', border: 'border-[#80DEEA]' },
}

interface ExplorerTypeSelectorProps {
  userId: string
  currentType: string | null
}

export default function ExplorerTypeSelector({
  userId,
  currentType,
}: ExplorerTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(currentType)
  const [isSaving, setIsSaving] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    if (!selectedType || selectedType === currentType) {
      setShowSelector(false)
      return
    }

    setIsSaving(true)

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ explorer_type: selectedType })
        .eq('id', userId)

      if (error) {
        console.error('Error updating explorer type:', error)
        alert('Errore durante l\'aggiornamento. Riprova.')
      } else {
        setShowSelector(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Errore durante l\'aggiornamento. Riprova.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!showSelector) {
    const colors = currentType ? explorerTypeDisplayColors[currentType] : null

    return (
      <div className="flex items-center gap-3">
        {currentType && colors ? (
          <div className={`flex-1 ${colors.bg} ${colors.hoverBg} ${colors.text} px-4 py-3 rounded-full border-2 ${colors.border} transition-colors duration-200 shadow-md text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis`}>
            {explorerTypeLabels[currentType]}
          </div>
        ) : (
          <div className="flex-1 px-4 py-2 rounded-lg font-semibold text-[#666] text-sm bg-[#F8F8F8] border border-[#E0E0E0]">
            Non selezionato
          </div>
        )}
        <button
          onClick={() => setShowSelector(true)}
          className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-gray-500 transition-colors flex-shrink-0"
          title="Change explorer type"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#D0D0D0] mt-3 rounded-lg p-4">
      <div className="text-sm font-semibold text-[#666] mb-3">
        Seleziona nuovo tipo:
      </div>
      <div className="flex flex-wrap gap-[10px] mb-4">
        {EXPLORER_TYPES.map(({ type, label, color }) => (
          <div
            key={type}
            className={`w-[calc((100%-20px)/3)] px-1 py-[6px] border ${
              selectedType === type
                ? 'border-[3px] border-[#333333] scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
                : 'border-[#C0C0C0]'
            } text-[10px] cursor-pointer text-center text-white font-semibold rounded ${color} transition-all box-border leading-[1.2]`}
            onClick={() => setSelectedType(type)}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={isSaving || selectedType === currentType}
          className="flex-1 px-4 py-3 bg-[#4CAF50] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#45a049] transition-colors text-sm"
        >
          {isSaving ? 'Salvataggio...' : 'Salva'}
        </button>
        <button
          onClick={() => {
            setSelectedType(currentType)
            setShowSelector(false)
          }}
          className="flex-1 px-4 py-2 bg-[#EFEFEF] text-[#666] rounded-lg font-medium hover:bg-[#E0E0E0] transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}

