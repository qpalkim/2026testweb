export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
});

export function getUserRole(user) {
  return user?.app_metadata?.role === USER_ROLES.ADMIN
    ? USER_ROLES.ADMIN
    : USER_ROLES.USER;
}

export function getUserRoleLabel(user) {
  return getUserRole(user) === USER_ROLES.ADMIN ? "관리자" : "사용자";
}
