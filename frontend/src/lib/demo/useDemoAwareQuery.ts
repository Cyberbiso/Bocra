'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/lib/store/hooks'

/**
 * Wraps `useQuery` with demo-mode awareness.
 *
 * When `isDemo === true`, the `fetchFn` is skipped entirely and
 * `demoFallback` is returned immediately (no network call, no loading state).
 *
 * When `isDemo === false`, behaves exactly like a plain `useQuery`.
 */
export function useDemoAwareQuery<T>({
  queryKey,
  fetchFn,
  demoFallback,
  enabled = true,
}: {
  queryKey: readonly unknown[]
  fetchFn: () => Promise<T>
  demoFallback: T
  enabled?: boolean
}): { data: T | undefined; isLoading: boolean; isError: boolean; error: Error | null } {
  const isDemo = useAppSelector((s) => s.demo.isDemo)

  const result = useQuery<T, Error>({
    queryKey,
    queryFn: isDemo
      ? () => Promise.resolve(demoFallback)
      : fetchFn,
    enabled,
    // In demo mode never go stale — data is static
    staleTime: isDemo ? Infinity : 60_000,
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
  }
}
