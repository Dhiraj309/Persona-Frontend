"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      setVerified(false)
    } else {
      setVerified(true)
    }
  }, [router])

  if (verified === null) return null // still loading / checking
  if (!verified) return null // redirecting
  return <>{children}</>
}