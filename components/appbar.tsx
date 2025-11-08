import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import SettingsDropdown from './settings-dropdown'

const links = [
	{ label: 'Dashboard', href: '/' },
	{ label: 'Transactions', href: '/transactions' },
]

const Appbar = () => {
	const pathname = usePathname()
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)
		const [user, setUser] = useState<{ name?: string; email?: string; picture?: string } | null>(null)

		useEffect(() => {
			function readUser() {
				try {
					const raw = localStorage.getItem('ft_user')
					if (raw) setUser(JSON.parse(raw))
					else setUser(null)
				} catch (err) {
					setUser(null)
				}
			}

			readUser()
			window.addEventListener('finance:auth:changed', readUser)
			return () => window.removeEventListener('finance:auth:changed', readUser)
		}, [])

	return (
<div className='fixed top-0 left-0 z-20 w-full bg-zinc-900 pt-safe'>
			<header className='border-b bg-zinc-100 px-safe dark:border-zinc-800 dark:bg-zinc-900'>
				<div className='mx-auto flex h-20 max-w-screen-md items-center justify-between px-6'>
					<Link href='/'>
						<h1 className='font-medium'>Finance Tracker</h1>
					</Link>

					<nav className='flex items-center space-x-6'>
						<div className='hidden sm:block'>
							<div className='flex items-center space-x-6'>
								{links.map(({ label, href }) => (
<Link
										key={label}
										href={href}
										className={`text-sm ${
pathname === href
? 'text-indigo-500 dark:text-indigo-400'
: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
}`}
									>
										{label}
									</Link>
								))}

								{/* Desktop Add text link */}
								<Link
									href='/add-transaction'
									className={`text-sm ${
										pathname === '/add-transaction'
											? 'text-indigo-500 dark:text-indigo-400'
											: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
									}`}
								>
									Add
								</Link>
							</div>
						</div>

						<div className='relative'>
							{/* Mobile: Navigate to settings page */}
							<div className='sm:hidden'>
								<Link
									href='/settings'
									title='Settings'
									className='block h-10 w-10 rounded-full bg-zinc-200 bg-cover bg-center shadow-inner transition-transform hover:scale-105 dark:bg-zinc-800'
									style={{
										backgroundImage:
											'url(https://images.unsplash.com/photo-1612480797665-c96d261eae09?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80)',
									}}
								/>
							</div>

							{/* Desktop: Show dropdown */}
							<div className='hidden sm:block'>
								<button
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
									title='Settings'
									className='h-10 w-10 rounded-full bg-zinc-200 bg-cover bg-center shadow-inner transition-transform hover:scale-105 dark:bg-zinc-800 overflow-hidden'
									style={{
										backgroundImage: `url(${user?.picture || 'https://images.unsplash.com/photo-1612480797665-c96d261eae09?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'})`,
									}}
								/>
								<SettingsDropdown
									isOpen={isDropdownOpen}
									onClose={() => setIsDropdownOpen(false)}
									user={user}
								/>
							</div>
						</div>
					</nav>
				</div>
			</header>
		</div>
	)
}

export default Appbar
