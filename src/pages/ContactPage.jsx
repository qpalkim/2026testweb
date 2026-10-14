import { useState } from "react";
import {
  Arrow,
  PageFrame,
  PageHeading,
} from "../components/site/InteriorLayout.jsx";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <PageFrame active="contact">
      <PageHeading
        eyebrow="CONTACT LOCALIT"
        number="03"
        title={
          <>
            동네에 대한 생각,
            <br />
            <em>로컬릿에 들려주세요.</em>
          </>
        }
        lead="제휴 제안, 서비스 문의, 동네에 관한 의견을 남길 수 있습니다."
      />
      <main className="interior-container interior-content contact-content">
        <aside className="contact-side-note">
          <p className="interior-eyebrow">WE WOULD LOVE TO HEAR FROM YOU</p>
          <h2>
            함께 만드는
            <br />더 좋은 동네 경험.
          </h2>
          <p>
            문의 유형을 선택하고 내용을 작성해 주세요. 현재는 문의 양식 시안만
            제공하며, 실제 전송은 아직 연결되어 있지 않습니다.
          </p>
          <div className="contact-topics">
            <span>제휴 문의</span>
            <span>서비스 문의</span>
            <span>동네 제보</span>
          </div>
        </aside>
        <form
          className="contact-page-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <label>
            이름
            <input
              name="name"
              autoComplete="name"
              placeholder="성함을 입력해 주세요"
              required
            />
          </label>
          <label>
            이메일
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="답변받을 이메일 주소"
              required
            />
          </label>
          <label>
            문의 유형
            <select name="topic" defaultValue="" required>
              <option value="" disabled>
                문의 유형을 선택해 주세요
              </option>
              <option>제휴 문의</option>
              <option>서비스 문의</option>
              <option>동네 제보</option>
              <option>기타</option>
            </select>
          </label>
          <label>
            문의 내용
            <textarea
              name="message"
              rows="6"
              placeholder="궁금한 점이나 제안하고 싶은 내용을 적어주세요"
              required
            />
          </label>
          <p className="contact-consent">
            입력하신 내용은 현재 서버로 전송되거나 저장되지 않습니다.
          </p>
          <button className="interior-button" type="submit">
            작성 내용 확인하기 <Arrow />
          </button>
          {submitted && (
            <p className="contact-result" role="status">
              필수 항목을 확인했습니다. 문의 전송 기능이 연결되면 접수할 수
              있습니다.
            </p>
          )}
        </form>
      </main>
    </PageFrame>
  );
}
