export function isUserAdminOrPM(userRole) {
  return ['ADMIN', 'PROJECT_MANAGER'].includes(userRole);
}
