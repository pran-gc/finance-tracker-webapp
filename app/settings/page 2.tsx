import Link from 'next/link'
import { useTheme } from 'next-themes'
import Page from '../../components/page'
import Section from '../../components/section'

export default function SettingsPage() {
	const { resolvedTheme, setTheme } = useTheme()

	return (
		<Page>
			<Section>
				<div className='mb-6'>
					<Link
						href='/'
						className='inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
					>
						<svg
							className='mr-2 h-4 w-4'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M15 19l-7-7 7-7'
							/>
						</svg>
						Back to Dashboard
					</Link>
				</div>

				<h1 className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
					Settings
				</h1>
			</Section>

			<Section>
				<div className='space-y-6'>
					{/* Theme Setting */}
					<div>
						<h2 className='mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
							Appearance
						</h2>
						<button
							onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
							className='flex w-full items-center justify-between rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
						>
							<div className='flex items-center space-x-3'>
								<svg
									className='h-6 w-6 text-zinc-600 dark:text-zinc-400'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									{resolvedTheme === 'dark' ? (
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
								<span className='text-base font-medium text-zinc-900 dark:text-zinc-100'>
									Theme
								</span>
							</div>
							<span className='text-sm text-zinc-500 dark:text-zinc-400'>
								{resolvedTheme === 'dark' ? 'Dark' : 'Light'}
							</span>
						</button>
					</div>

					{/* Account Settings */}
					<div>
						<h2 className='mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
							Account
						</h2>
						<button className='flex w-full items-center space-x-3 rounded-lg p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800'>
							<svg
								className='h-6 w-6 text-zinc-600 dark:text-zinc-400'
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
							<span className='text-base font-medium text-zinc-900 dark:text-zinc-100'>
								Account Settings
							</span>
							<svg
								className='ml-auto h-5 w-5 text-zinc-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 5l7 7-7 7'
								/>
							</svg>
						</button>
					</div>

					{/* App Settings */}
					<div>
						<h2 className='mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
							App
						</h2>
						<button className='flex w-full items-center space-x-3 rounded-lg p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800'>
							<svg
								className='h-6 w-6 text-zinc-600 dark:text-zinc-400'
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
							<span className='text-base font-medium text-zinc-900 dark:text-zinc-100'>
								App Settings
							</span>
							<svg
								className='ml-auto h-5 w-5 text-zinc-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 5l7 7-7 7'
								/>
							</svg>
						</button>
					</div>
				</div>
			</Section>

			{/* Sign Out Section */}
			<Section>
				<button className='flex w-full items-center justify-center space-x-3 rounded-lg bg-red-50 p-4 text-left transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'>
					<svg
						className='h-6 w-6 text-red-600 dark:text-red-400'
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
					<span className='text-base font-medium text-red-700 dark:text-red-300'>
						Sign Out
					</span>
				</button>
			</Section>
		</Page>
	)
}