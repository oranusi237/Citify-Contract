export const resolveProtectedRouteState = ({ user, isAdmin, authLoading }) => {
  if (authLoading || user === undefined) return 'loading'
  if (!user || !isAdmin) return 'redirect'
  return 'allow'
}