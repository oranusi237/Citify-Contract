import { describe, expect, it } from 'vitest'
import { resolveProtectedRouteState } from './protectedRouteState'

describe('resolveProtectedRouteState', () => {
  it('returns loading while auth is resolving', () => {
    expect(resolveProtectedRouteState({ user: undefined, isAdmin: false, authLoading: true })).toBe('loading')
  })

  it('returns redirect for non-admin authenticated users', () => {
    expect(resolveProtectedRouteState({ user: { uid: '123' }, isAdmin: false, authLoading: false })).toBe('redirect')
  })

  it('returns redirect for signed-out users', () => {
    expect(resolveProtectedRouteState({ user: null, isAdmin: false, authLoading: false })).toBe('redirect')
  })

  it('returns allow for authenticated admins', () => {
    expect(resolveProtectedRouteState({ user: { uid: '123' }, isAdmin: true, authLoading: false })).toBe('allow')
  })
})
