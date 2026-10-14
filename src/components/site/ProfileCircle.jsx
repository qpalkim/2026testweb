export function ProfileCircle({ name = "회원", className = "" }) {
  const initial = [...name.trim()][0] || "회";

  return (
    <span
      className={`profile-circle${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={`${name || "회원"} 프로필`}
    >
      {initial}
    </span>
  );
}
