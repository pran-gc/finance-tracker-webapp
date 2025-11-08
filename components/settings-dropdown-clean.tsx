"use client"

import React from 'react'

export default function SettingsDropdownClean({ isOpen }: { isOpen?: boolean }) {
  if (!isOpen) return null
  return (
    <div className='absolute right-0 top-full mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 p-3'>
      <a href='/logout' className='block text-sm text-zinc-700 dark:text-zinc-200 py-2'>Sign Out</a>
    </div>
  )
}
