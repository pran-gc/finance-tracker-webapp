import Appbar from '@/components/appbar'
import BottomNav from '@/components/bottom-nav'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

interface Props {
	title?: string
	children: React.ReactNode
}

const Page = ({ title, children }: Props) => (
	<>
		<Appbar />

		<main
			/**
			 * Padding top = `appbar` height
			 * Padding bottom = `bottom-nav` height
			 *
			 * Make the main container full-width on very small screens so page
			 * content lines up with the app title. Constrain to
			 * `max-w-screen-md` starting at the `sm` breakpoint.
			 */
			className='mx-auto w-full sm:max-w-screen-md pt-20 pb-16 px-safe sm:pb-0 flex-1 flex'
		>
			<div className='p-6 flex flex-col w-full'>{children}</div>
		</main>

		{/* Floating action button for mobile (above bottom nav) */}
		<div className='fixed bottom-24 right-4 sm:hidden z-30'>
			<Link
				href='/add-transaction'
				aria-label='Add'
				className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105'
			>
				<FontAwesomeIcon icon={faPlus} className='h-6 w-6' />
			</Link>
		</div>

		<BottomNav />
	</>
)

export default Page
