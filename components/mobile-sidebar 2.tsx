import { useEffect } from 'react'
import { useTheme } from 'next-themes'

interface MobileSidebarProps {
	isOpen: boolean
	onClose: () => void
}

const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
	const { theme, setTheme } = useTheme()

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	if (!isOpen) return null

	return (
		<>
			{/* Backdrop */}
			<div
				className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm'
				onClick={onClose}
			/>

			{/* Sidebar */}
			<div className='fixed right-0 top-0 z-50 h-full w-80 bg-white shadow-xl dark:bg-zinc-900'>
				<div className='flex h-full flex-col'>
					{/* Header */}
					<div className='flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-700'>
						<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
							Settings
						</h2>
						<button
							onClick={onClose}
							className='rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
						>
							<svg
								className='h-5 w-5'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</button>
					</div>

					{/* Content */}
					<div className='flex-1 overflow-y-auto p-6'>
						<div className='space-y-6'>
							{/* Theme Section */}
							<div>
								<h3 className='mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100'>
									Appearance
								</h3>
								<button
									onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
									className='flex w-full items-center justify-between rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
								>
									<div className='flex items-center space-x-3'>
										<svg
											className='h-5 w-5 text-zinc-600 dark:text-zinc-400'
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
										<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
											Theme
										</span>
									</div>
									<span className='text-sm text-zinc-500 dark:text-zinc-400'>
										{theme === 'dark' ? 'Dark' : 'Light'}
									</span>
								</button>
							</div>

							{/* Account Section */}
							<div>
								<h3 className='mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100'>
									Account
								</h3>
								<div className='space-y-2'>
									<button className='flex w-full items-center space-x-3 rounded-lg p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800'>
										<svg
											className='h-5 w-5 text-zinc-600 dark:text-zinc-400'
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
										<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
											Account Settings
										</span>
									</button>
								</div>
							</div>

							{/* App Section */}
							<div>
								<h3 className='mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100'>
									App
								</h3>
								<div className='space-y-2'>
									<button className='flex w-full items-center space-x-3 rounded-lg p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800'>
										<svg
											className='h-5 w-5 text-zinc-600 dark:text-zinc-400'
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
										<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
											App Settings
										</span>
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className='border-t border-zinc-200 p-6 dark:border-zinc-700'>
						<button className='flex w-full items-center justify-center space-x-3 rounded-lg bg-red-50 p-4 text-left transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'>
							<svg
								className='h-5 w-5 text-red-600 dark:text-red-400'
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
							<span className='text-sm font-medium text-red-700 dark:text-red-300'>
								Sign Out
							</span>
						</button>
					</div>
				</div>
			</div>
		</>
	)
}

export default MobileSidebar