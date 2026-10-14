import { useState } from "react";
import { Arrow, PageFrame } from "../components/site/InteriorLayout.jsx";
import {
  ensureUserProfile,
  getAuthErrorMessage,
  supabase,
} from "../lib/supabase.js";

export function LoginPage() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email").trim();
    const password = formData.get("password");

    setError("");

    if (!supabase) {
      setError("Supabase 설정을 확인할 수 없습니다. 관리자에게 문의해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (loginError) throw loginError;

      await ensureUserProfile(data.user);
      window.location.replace("/");
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError, "login"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageFrame active="login">
      <main className="auth-main">
        <div className="auth-layout">
          <section className="auth-intro">
            <p className="interior-eyebrow">
              <i />
              WELCOME BACK
            </p>
            <h1>
              동네의 좋은 시간,
              <br />
              <em>다시 이어가요.</em>
            </h1>
            <p>로그인하고 나만의 동네 발견을 이어가세요.</p>
            <span className="auth-decoration" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </section>
          <section className="auth-card" aria-labelledby="login-title">
            <p className="interior-eyebrow">LOCALIT ACCOUNT</p>
            <h2 id="login-title">로그인</h2>
            <p className="auth-card-copy">로컬릿 계정으로 계속 둘러보세요.</p>
            <form onSubmit={handleLogin}>
              <label>
                이메일
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                />
              </label>
              <label>
                비밀번호
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해 주세요"
                  required
                />
              </label>
              <button
                className="interior-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "로그인 중" : "로그인"}
                <Arrow />
              </button>
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
            </form>
            <p className="auth-switch">
              아직 계정이 없으신가요? <a href="/signup">회원가입</a>
            </p>
          </section>
        </div>
      </main>
    </PageFrame>
  );
}
