"use client"
import { useEffect, useState } from "react"
import { currenciesApi, settingsApi } from "@/lib/api"

interface Currency {
  id: number
  code: string
  name: string
  symbol: string
}

export default function CurrencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const [currenciesResponse, settingsResponse] = await Promise.all([
          currenciesApi.getAll(),
          settingsApi.get()
        ])

        if (!mounted) return

        setCurrencies(currenciesResponse.currencies)
        setSelected(settingsResponse.settings?.default_currency_id ?? currenciesResponse.currencies[0]?.id ?? null)
      } catch (err) {
        console.error("currency modal load failed", err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [open])

  const save = async () => {
    if (selected === null) return
    setSaving(true)
    try {
      await settingsApi.update({ default_currency_id: Number(selected) })
      // Dispatch event to notify other components that currency changed
      window.dispatchEvent(new Event('finance:currency:changed'))
      onClose()
    } catch (err) {
      console.error('save currency failed', err)
      alert('Failed to save currency setting')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-zinc-800">
        <h3 className="text-lg font-semibold">Change Currency</h3>
        <div className="mt-4 max-h-64 overflow-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-500">Loading...</div>
          ) : (
            <div className="space-y-2">
                {currencies.map((c: any) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 ${selected === c.id ? 'bg-zinc-50 dark:bg-zinc-700' : ''}`}
                  >
                    <input
                      type="radio"
                      name="currency"
                      checked={selected === c.id}
                      onChange={() => setSelected(Number(c.id))}
                      className="ml-1"
                    />
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-10 flex-shrink-0 flex items-center justify-center rounded border border-zinc-300 text-center text-sm font-medium dark:border-zinc-700">
                        {c.symbol}
                      </div>
                      <div className="text-sm">{c.code} — {c.name}</div>
                    </div>
                  </label>
                ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-md px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
