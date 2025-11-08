"use client"
import { useEffect, useState } from "react"

export default function CurrencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [currencies, setCurrencies] = useState<Array<any>>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const mod = await import("@/lib/data")
        let cs = await mod.getCurrencies()
        // If no currencies exist yet, seed defaults then reload
        if (!cs || cs.length === 0) {
          try {
            await mod.seedCurrencies()
          } catch (err) {
            console.warn('seeding currencies failed', err)
          }
          cs = await mod.getCurrencies()
        }
        const settings = await mod.getAppSettings()
        if (!mounted) return
  setCurrencies(cs || [])
  setSelected((settings?.default_currency_id ?? (cs?.[0]?.id ?? null)) as number | null)
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
    try {
      const mod = await import("@/lib/data")
      // updateAppSettings expects numbers for ids
      await mod.updateAppSettings({ default_currency_id: Number(selected) })
      // notify app
      window.dispatchEvent(new CustomEvent('finance:data:changed'))
      onClose()
    } catch (err) {
      console.error('save currency failed', err)
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
          <button className="rounded-md px-3 py-1 text-sm" onClick={onClose}>Cancel</button>
          <button className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
