import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { getUserRoleLabel } from "../../lib/userRole.js";
import { ProfileCircle } from "./ProfileCircle.jsx";

export function AccountActions({ active, variant = "interior" }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    let isMounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    supabase.auth
      .getUser()
      .then(({ data, error: authError }) => {
        if (!isMounted) return;
        setUser(data.user ?? null);
        setIsLoading(false);
        if (authError) setError("계정 상태를 확인하지 못했습니다.");
      })
      .catch(() => {
        if (!isMounted) return;
        setIsLoading(false);
        setError("계정 상태를 확인하지 못했습니다.");
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (!supabase) return;

    setIsSigningOut(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSigningOut(false);
    }
  }

  const accountName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "회원";

  return (
    <div className={`${variant}-account-links`}>
      {isLoading ? (
        <span
          className="account-state-loading"
          aria-label="계정 상태 확인 중"
        />
      ) : user ? (
        <>
          <ProfileCircle name={accountName} className="profile-circle-header" />
          <span className="account-role">{getUserRoleLabel(user)}</span>
          <span className="account-greeting" title={user.email || accountName}>
            {accountName}님
          </span>
          <a
            href="/mypage"
            aria-current={active === "mypage" ? "page" : undefined}
          >
            마이페이지
          </a>
          <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? "로그아웃 중" : "로그아웃"}
          </button>
        </>
      ) : (
        <>
          <a
            href="/login"
            aria-current={active === "login" ? "page" : undefined}
          >
            로그인
          </a>
          <a
            className={
              variant === "home" ? "header-cta" : "interior-header-cta"
            }
            href="/signup"
            aria-current={active === "signup" ? "page" : undefined}
          >
            회원가입
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M3.5 10h12M10 4.5l5.5 5.5-5.5 5.5" />
            </svg>
          </a>
        </>
      )}
      {error && (
        <span className="account-action-error" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
