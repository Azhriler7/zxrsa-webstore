export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  const role = (user.value as any)?.role

  if (!loggedIn.value || role !== 'admin')
    return navigateTo('/admin/login')
})

