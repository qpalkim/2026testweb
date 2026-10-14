import { useState } from "react";
import { Arrow, PageFrame } from "../components/site/InteriorLayout.jsx";
import {
  ensureUserProfile,
  getAuthErrorMessage,
  supabase,
} from "../lib/supabase.js";

export function SignupPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileWarning, setProfileWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");

    setMessage("");
    setError("");
    setProfileWarning("");

    if (!name) {
      setError("이름을 입력해 주세요.");
      return;
    }

    if (password !== formData.get("passwordConfirm")) {
      setError("비밀번호가 서로 다릅니다. 다시 확인해 주세요.");
      return;
    }

    if (!supabase) {
      setError("Supabase 설정을 확인할 수 없습니다. 관리자에게 문의해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: new URL("/login", window.location.origin).toString(),
        },
      });

      if (signupError) throw signupError;

      if (data.session && data.user) {
        const profileError = await ensureUserProfile(data.user, name);
        if (profileError) {
          setProfileWarning(
            "계정은 생성됐지만 프로필 저장에 실패했습니다. 로그인 후 다시 시도해 주세요.",
          );
        }
        setMessage("회원가입이 완료됐습니다. 로그인해 주세요.");
      } else {
        setMessage(
          "가입 확인 메일을 보냈습니다. 이메일 인증을 완료한 뒤 로그인해 주세요.",
        );
      }

      form.reset();
    } catch (signupError) {
      setError(getAuthErrorMessage(signupError, "signup"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageFrame active="signup">
      <main className="auth-main signup-main">
        <div className="auth-layout">
          <section className="auth-intro">
            <p className="interior-eyebrow">
              <i />
              FIND YOUR LOCAL
            </p>
            <h1>
              좋아하는 동네를
              <br />
              <em>하나씩 모아보세요.</em>
            </h1>
            <p>로컬릿과 함께 가까운 곳의 새로운 취향을 발견해 보세요.</p>
            <span className="auth-decoration" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </section>
          <section className="auth-card" aria-labelledby="signup-title">
            <p className="interior-eyebrow">JOIN LOCALIT</p>
            <h2 id="signup-title">회원가입</h2>
            <p className="auth-card-copy">새로운 동네 발견을 시작해 보세요.</p>
            <form onSubmit={handleSignup}>
              <label>
                이름
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={50}
                  placeholder="이름을 입력해 주세요"
                  required
                />
              </label>
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
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="8자 이상 입력해 주세요"
                  required
                />
              </label>
              <label>
                비밀번호 확인
                <input
                  type="password"
                  name="passwordConfirm"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="비밀번호를 다시 입력해 주세요"
                  required
                />
              </label>
              <p className="auth-notice">
                이름과 이메일은 계정 및 프로필 정보로 저장됩니다. 비밀번호는
                Supabase Auth에서 관리합니다.
              </p>
              <button
                className="interior-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "가입 처리 중" : "회원가입"}
                <Arrow />
              </button>
              {error && (
                <p className="auth-error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="auth-status" role="status">
                  {message}
                </p>
              )}
              {profileWarning && (
                <p className="auth-error" role="status">
                  {profileWarning}
                </p>
              )}
            </form>
            <p className="auth-switch">
              이미 계정이 있으신가요? <a href="/login">로그인</a>
            </p>
          </section>
        </div>
      </main>
    </PageFrame>
  );
}
