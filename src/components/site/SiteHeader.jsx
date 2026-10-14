import { useEffect, useRef, useState } from "react";
import { AccountActions } from "./AccountActions.jsx";

const pageLinks = [
  ["회사 소개", "/company", "company"],
  ["제품 소개", "/product", "product"],
  ["온라인 문의", "/contact", "contact"],
  ["커뮤니티", "/community", "community"],
  ["공지사항", "/notices", "notices"],
];

function BrandMark({ variant }) {
  return (
    <span className={variant === "home" ? "brand-mark" : "interior-brand-mark"}>
      <i />
    </span>
  );
}

function HeaderNavigation({ variant, active, onNavigate }) {
  const navClass = variant === "home" ? "main-nav" : "interior-nav";
  return (
    <nav className={navClass} aria-label="주요 메뉴">
      {pageLinks.map(([label, href, key]) => (
        <a
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          onClick={onNavigate}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

export function SiteHeader({ variant = "interior", active }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const isHome = variant === "home";

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusableItems = menuPanelRef.current?.querySelectorAll(
          'a[href], button:not([disabled])',
        );
        if (!focusableItems?.length) return;
        const firstItem = focusableItems[0];
        const lastItem = focusableItems[focusableItems.length - 1];
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuPanelRef.current?.querySelector(".mobile-site-menu-close")?.focus();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  return (
    <header className={`unified-header ${isHome ? "unified-header-home page-wrap" : "unified-header-interior"}`}>
      <a className={isHome ? "brand" : "interior-brand"} href="/" aria-label="로컬릿 홈">
        <BrandMark variant={variant} />
        로컬릿<span className={isHome ? "brand-period" : undefined}>.</span>
      </a>

      <button
        ref={menuButtonRef}
        className="mobile-menu-toggle"
        type="button"
        aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-site-menu"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span /><span />
      </button>

      <div className="unified-header-desktop">
        <HeaderNavigation variant={variant} active={active} />
        <AccountActions variant={variant} active={active} />
      </div>

      {isMenuOpen && (
        <>
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="메뉴 닫기"
            onClick={closeMenu}
          />
          <div
            id="mobile-site-menu"
            ref={menuPanelRef}
            className="mobile-site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="사이트 메뉴"
          >
            <div className="mobile-site-menu-heading">
              <span>LOCALIT MENU</span>
              <button className="mobile-site-menu-close" type="button" onClick={closeMenu} aria-label="메뉴 닫기">
                <span /><span />
              </button>
            </div>
            <HeaderNavigation variant={variant} active={active} onNavigate={closeMenu} />
            <div className="mobile-site-menu-account" onClick={(event) => {
              if (event.target.closest("a, button")) closeMenu();
            }}>
              <AccountActions variant={variant} active={active} />
            </div>
          </div>
        </>
      )}
    </header>
  );
}
