import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LoginClient from './LoginClient'

export default async function Page() {
  const cookieStore = await cookies()
  const c = cookieStore.get('ft_authenticated')
  if (c && c.value === '1') {
    // Server-side redirect before rendering the login page
    redirect('/')
  }

  return <LoginClient />
}
