import { useState, useCallback, useEffect } from "react"
import { api } from "@/api/client"

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"))
  const isLoggedIn = !!token

  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem("token")
      setToken(null)
    }
    window.addEventListener("auth:logout", handleLogout)
    return () => window.removeEventListener("auth:logout", handleLogout)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post("/login", { username, password })
    const newToken = res.data.accessToken
    localStorage.setItem("token", newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setToken(null)
  }, [])

  return { token, isLoggedIn, login, logout }
}
