import { SiteHeader } from "./SiteHeader.jsx";

const pageLinks = [
  ["회사 소개", "/company"],
  ["제품 소개", "/product"],
  ["온라인 문의", "/contact"],
  ["커뮤니티", "/community"],
  ["공지사항", "/notices"],
];

function Brand() {
  return (
    <span className="interior-brand-mark">
      <i />
    </span>
  );
}

export function Arrow({ diagonal = false }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`interior-arrow${diagonal ? " is-diagonal" : ""}`}
    >
      <path d="M3.5 10h12M10 4.5l5.5 5.5-5.5 5.5" />
    </svg>
  );
}

function SiteFooter() {
  return (
    <footer className="interior-footer">
      <div className="interior-footer-inner">
        <a className="interior-brand" href="/">
          <Brand />
          로컬릿<span>.</span>
        </a>
        <p>좋은 하루는 가까이에.</p>
        <nav aria-label="하단 메뉴">
          {pageLinks.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
          <a href="/login">로그인</a>
          <a href="/signup">회원가입</a>
        </nav>
        <small>© 2025 LOCALIT. ALL RIGHTS RESERVED.</small>
      </div>
    </footer>
  );
}

export function PageFrame({ active, children }) {
  return (
    <div className="interior-site">
      <SiteHeader active={active} />
      {children}
      <SiteFooter />
    </div>
  );
}

export function PageHeading({ eyebrow, title, lead, number, total = "04" }) {
  return (
    <section className="interior-hero">
      <div className="interior-container interior-hero-grid">
        <div>
          <p className="interior-eyebrow">
            <i />
            {eyebrow}
          </p>
          <h1>{title}</h1>
          <p className="interior-lead">{lead}</p>
        </div>
        <div className={`interior-orbit orbit-${number}`} aria-hidden="true">
          <span className="orbit-ring ring-one" />
          <span className="orbit-ring ring-two" />
          <span className="orbit-core">
            <Brand />
          </span>
          <b>{number}</b>
        </div>
      </div>
      <div className="interior-container interior-breadcrumb">
        <span>LOCALIT</span>
        <span>
          {number} / {total}
        </span>
      </div>
    </section>
  );
}
