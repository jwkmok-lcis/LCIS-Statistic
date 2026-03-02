'use client'

import { signout } from '@/app/auth/actions'

export default function LogoutButton() {
  return (
    <form action={signout}>
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-gray-700 transition"
      >
        Sign out
      </button>
    </form>
  )
}
