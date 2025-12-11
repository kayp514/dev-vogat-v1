'use client'

import { useState, useCallback, useTransition } from 'react'
import { useDebounce } from './use-debounce'
import type {  User } from '@/lib/db/types'

const API = "https://api-vogat.vercel.app"
const API_VERSION = "v1"
const SEARCH_ENDPOINT = "users/search"

export function useSearch() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const debouncedSearch = useDebounce(searchQuery, 300)

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)


    startTransition(async () => {
      try {
        const response = await fetch(`${API}/${API_VERSION}/${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        if (data.success) {
          setUsers(data.users)
        } else {
          setUsers([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setUsers([])
      }
    })
  }, [])

  return {
    users,
    searchQuery,
    isPending,
    updateSearchQuery,
    clearSearch: useCallback(() => {
      setSearchQuery('')
      setUsers([])
    }, [])
  }
}