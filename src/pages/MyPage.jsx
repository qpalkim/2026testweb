import { useEffect, useState } from "react";
import { PageFrame } from "../components/site/InteriorLayout.jsx";
import { ProfileCircle } from "../components/site/ProfileCircle.jsx";
import { ensureUserProfile, supabase } from "../lib/supabase.js";
import { getUserRoleLabel } from "../lib/userRole.js";

export function MyPage() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!supabase) {
        setError("Supabase 설정을 확인할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (!isMounted) return;

        if (authError) {
          setError(
            "계정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          window.location.replace("/login");
          return;
        }

        setUser(authData.user);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (profileError) {
          setError("프로필 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
          setIsLoading(false);
          return;
        }

        if (!profile) {
          const createError = await ensureUserProfile(authData.user);
          if (createError) {
            setError("프로필을 준비하지 못했습니다. 다시 로그인해 주세요.");
            setIsLoading(false);
            return;
          }
          setDisplayName(
            authData.user.user_metadata?.display_name ||
              authData.user.email?.split("@")[0] ||
              "로컬릿 사용자",
          );
        } else {
          setDisplayName(profile.display_name);
        }

        setIsProfileReady(true);
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setError("프로필 정보를 불러오지 못했습니다. 다시 시도해 주세요.");
        setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    const normalizedName = displayName.trim();

    setMessage("");
    setError("");

    if (!normalizedName || normalizedName.length > 50) {
      setError("이름은 1자 이상 50자 이하로 입력해 주세요.");
      return;
    }

    if (!supabase || !user) {
      setError("로그인 상태를 확인할 수 없습니다. 다시 로그인해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error: saveError } = await supabase
        .from("profiles")
        .update({
          display_name: normalizedName,
        })
        .eq("id", user.id)
        .select("display_name")
        .single();

      if (saveError) throw saveError;

      setDisplayName(data.display_name);
      const { data: authUpdate, error: metadataError } =
        await supabase.auth.updateUser({
          data: { display_name: normalizedName },
        });

      if (metadataError) {
        setMessage("프로필은 저장했지만 헤더 이름을 갱신하지 못했습니다.");
      } else {
        if (authUpdate.user) setUser(authUpdate.user);
        setMessage("프로필을 저장했습니다.");
      }
    } catch {
      setError("프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageFrame active="mypage">
      <main className="profile-page">
        <section className="profile-page-hero">
          <div className="interior-container">
            <p className="interior-eyebrow">
              <i />
              YOUR LOCALIT PROFILE
            </p>
            <h1>마이페이지</h1>
            <p>나를 소개하는 이름과 프로필을 관리해 보세요.</p>
          </div>
        </section>

        <section className="interior-container profile-content">
          {isLoading ? (
            <p className="profile-feedback" role="status">
              프로필을 불러오는 중입니다.
            </p>
          ) : !isProfileReady ? (
            <p className="profile-feedback auth-error" role="alert">
              {error || "프로필 정보를 불러오지 못했습니다."}
            </p>
          ) : (
            <div className="profile-editor">
              <section
                className="profile-avatar-panel"
                aria-labelledby="profile-circle-title"
              >
                <div className="profile-avatar-preview">
                  <ProfileCircle
                    name={displayName}
                    className="profile-circle-large"
                  />
                </div>
                <div>
                  <p className="interior-eyebrow">YOUR PROFILE</p>
                  <h2 id="profile-circle-title">기본 프로필</h2>
                  <p>이름의 첫 글자가 원형 프로필에 표시됩니다.</p>
                  {user && (
                    <span
                      className={`profile-role-badge ${user.app_metadata?.role === "admin" ? "is-admin" : ""}`}
                    >
                      {getUserRoleLabel(user)} 계정
                    </span>
                  )}
                </div>
              </section>

              <form className="profile-form" onSubmit={handleSave}>
                <div className="profile-form-heading">
                  <div>
                    <p className="interior-eyebrow">ACCOUNT DETAILS</p>
                    <h2>프로필 정보</h2>
                  </div>
                  <span>변경한 내용은 저장 후 적용됩니다.</span>
                </div>
                <label>
                  이름
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={50}
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  이메일
                  <input type="email" value={user?.email ?? ""} readOnly />
                  <small>이메일 주소는 로그인 계정 설정에서 관리됩니다.</small>
                </label>
                {error && (
                  <p className="profile-feedback auth-error" role="alert">
                    {error}
                  </p>
                )}
                {message && (
                  <p className="profile-feedback auth-status" role="status">
                    {message}
                  </p>
                )}
                <button
                  className="interior-button profile-save-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중" : "변경사항 저장"}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </PageFrame>
  );
}
