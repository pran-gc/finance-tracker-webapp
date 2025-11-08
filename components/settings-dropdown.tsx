"use client"

import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'

const CurrencyModal = dynamic(() => import('./currency-modal'), { ssr: false })

interface SettingsDropdownProps {
	isOpen: boolean
	onClose: () => void
	user?: { name?: string; email?: string; picture?: string } | null
}

const SettingsDropdown = ({ isOpen, onClose, user }: SettingsDropdownProps) => {
	const dropdownRef = useRef<HTMLDivElement>(null)
	const { theme, setTheme } = useTheme()

	const [openCurrencyModal, setOpenCurrencyModal] = useState(false)
	const [currencySymbol, setCurrencySymbol] = useState<string | null>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen, onClose])

	useEffect(() => {
		let mounted = true
		if (!isOpen) return
		;(async () => {
			try {
				const mod = await import('@/lib/data')
				const settings = await mod.getAppSettings()
				const currencies = await mod.getCurrencies()
				if (!mounted) return
				const cur = currencies.find((c: any) => c.id === settings?.default_currency_id)
				setCurrencySymbol(cur?.symbol ?? cur?.code ?? null)
			} catch (e) {
				// ignore
			}
		})()

		return () => { mounted = false }
	}, [isOpen])

	return (
		<>
			{/* Desktop Dropdown - hidden on small screens */}
			<div className='hidden sm:block'>
				{isOpen && (
					<div
						ref={dropdownRef}
						className='absolute right-0 top-full mt-2 w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800'
					>
						<div className='p-2'>
							<div className='px-3 py-2'>
								{user ? (
									<div className='flex items-center gap-3'>
										<div className='h-10 w-10 flex-shrink-0 rounded-full bg-zinc-200 bg-cover bg-center dark:bg-zinc-700' style={{ backgroundImage: `url(${user.picture})` }} />
										<div>
											<div className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>{user.name}</div>
											<div className='text-xs text-zinc-500 dark:text-zinc-400'>{user.email}</div>
										</div>
									</div>
								) : (
									<div className='px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100'>
										Settings
									</div>
								)}
							</div>

							<hr className='my-2 border-zinc-200 dark:border-zinc-700' />

							<div className='space-y-1'>
								<button
									onClick={() => setOpenCurrencyModal(true)}
									className='flex w-full items-center rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
								>
									<div className='mr-3 flex items-center'>
										<div className='flex h-6 w-6 items-center justify-center rounded-sm border border-zinc-300 text-sm font-medium dark:border-zinc-700'>
											{currencySymbol ?? '$'}
										</div>
									</div>
									<div>Change Currency</div>
								</button>

								<button
									onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
									className='flex w-full items-center rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
								>
									<svg
										className='mr-3 h-4 w-4'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										{theme === 'dark' ? (
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
											/>
										) : (
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
											/>
										)}
									</svg>
									{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
								</button>

								<button
									onClick={async () => {
										console.debug('SettingsDropdown: Sign Out clicked')
										// sign out flow: try final backup, sign out and clear local DB
										try {
											// call client sign out helpers (import dynamically to avoid SSR issues)
											const mod = await import('@/lib/googleDrive')
											const sync = await import('@/lib/sync')
											const db = await import('@/lib/db')
											try {
												if (await (mod.isSignedIn?.() ?? false)) {
													await sync.syncService.backupToDrive()
												}
											} catch (e) {
												console.warn('backup before signout failed', e)
											}
											try { await mod.signOut() } catch (e) { console.warn('signOut failed', e) }
											try { await db.clearDB() } catch (e) { console.warn('clearDB failed', e) }
											window.location.href = '/'
										} catch (err) {
											console.error('Sign out flow failed', err)
										}
									}}
									className='flex w-full items-center rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
								>
									<svg
										className='mr-3 h-4 w-4'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
										/>
									</svg>
									Account Settings
								</button>

								<button
									onClick={async () => {
										try {
											const mod = await import('@/lib/googleDrive')
											const sync = await import('@/lib/sync')
											const db = await import('@/lib/db')
											try {
												// Only attempt a final backup if we have a valid in-memory token
												if (mod.hasValidAccessToken && mod.hasValidAccessToken()) {
													await sync.syncService.backupToDrive()
												}
											} catch (e) {
												console.warn('backup before signout failed', e)
											}
											try { await mod.signOut() } catch (e) { console.warn('signOut failed', e) }
											try { await db.clearDB() } catch (e) { console.warn('clearDB failed', e) }
											window.location.href = '/login'
										} catch (err) {
											console.error('Sign out flow failed', err)
										}
									}}
									className='flex w-full items-center rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'>
									<svg
										className='mr-3 h-4 w-4'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
										/>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
									</svg>
									App Settings
								</button>

								<hr className='my-2 border-zinc-200 dark:border-zinc-700' />
								<a href='/logout' className=''>

									<button className='flex w-full items-center rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'>
										<svg
											className='mr-3 h-4 w-4'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
											/>
										</svg>
										Sign Out
									</button>
								</a>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Currency modal (client-only) */}
			{openCurrencyModal && (
				<CurrencyModal open={openCurrencyModal} onClose={() => setOpenCurrencyModal(false)} />
			)}
		</>
	)
}

export default SettingsDropdown