import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

export function getAuthErrorMessage(error, action) {
  if (error?.code === "email_not_confirmed") {
    return "이메일 인증을 완료한 뒤 로그인해 주세요.";
  }

  if (error?.code === "invalid_credentials") {
    return "이메일 또는 비밀번호를 확인해 주세요.";
  }

  if (error?.code === "weak_password") {
    return "더 안전한 비밀번호를 입력해 주세요. 비밀번호는 8자 이상이어야 합니다.";
  }

  if (error?.code === "over_email_send_rate_limit") {
    return "인증 메일 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (error?.status === 429) {
    return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  return action === "signup"
    ? "회원가입을 완료하지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요."
    : "로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.";
}

export async function ensureUserProfile(user, displayName) {
  if (!supabase || !user?.id) {
    return new Error("인증된 사용자 정보를 확인할 수 없습니다.");
  }

  const metadataName = user.user_metadata?.display_name;
  const profileName = (
    displayName?.trim() ||
    (typeof metadataName === "string" ? metadataName.trim() : "") ||
    user.email?.split("@")[0] ||
    "로컬릿 사용자"
  ).slice(0, 50);

  try {
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, display_name: profileName },
        { onConflict: "id", ignoreDuplicates: true },
      );

    return error;
  } catch (error) {
    return error;
  }
}
