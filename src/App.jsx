import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { SiteHeader } from "./components/site/SiteHeader.jsx";
import { supabase } from "./lib/supabase.js";
import {
  CompanyPage,
  CommunityPage,
  ContactPage,
  LoginPage,
  MyPage,
  NoticePage,
  ProductPage,
  SignupPage,
} from "./pages/SitePages.jsx";

const places = [
  {
    name: "모노키친",
    kind: "브런치 · 양식",
    distance: "도보 4분",
    time: "09:00–21:00",
    rating: "4.92",
    tag: "지금 인기",
    tone: "coral",
    category: "식사",
  },
  {
    name: "페이지오프",
    kind: "커피 · 디저트",
    distance: "도보 6분",
    time: "08:30–22:00",
    rating: "4.87",
    tag: "조용한 작업",
    tone: "sage",
    category: "카페",
  },
  {
    name: "온기서점",
    kind: "독립서점 · 문구",
    distance: "도보 8분",
    time: "11:00–20:00",
    rating: "4.91",
    tag: "동네의 발견",
    tone: "sand",
    category: "문화",
  },
];

const categories = ["전체", "식사", "카페", "문화"];

function formatNoticeDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function Arrow({ diagonal = false }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={diagonal ? "arrow-icon diagonal" : "arrow-icon"}
    >
      <path d="M3.5 10h12M10 4.5l5.5 5.5-5.5 5.5" />
    </svg>
  );
}

let kakaoMapsPromise;

function loadKakaoMaps(appKey) {
  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao.maps.load(() => resolve(window.kakao.maps)));
  }
  if (kakaoMapsPromise) return kakaoMapsPromise;

  kakaoMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.async = true;
    script.dataset.kakaoMapSdk = "true";
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps SDK did not initialize."));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    };
    script.onerror = () => reject(new Error("Kakao Maps SDK failed to load."));
    document.head.appendChild(script);
  }).catch((error) => {
    kakaoMapsPromise = null;
    throw error;
  });

  return kakaoMapsPromise;
}

function HomePage() {
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("서울 성수동");
  const [locationCoordinates, setLocationCoordinates] = useState(null);
  const [mapStatus, setMapStatus] = useState(() =>
    import.meta.env.VITE_KAKAOMAP_KEY?.trim() ? "loading" : "missing-key",
  );
  const [message, setMessage] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [recentNotices, setRecentNotices] = useState([]);
  const [noticeStatus, setNoticeStatus] = useState("loading");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const locationCoordinatesRef = useRef(null);

  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAOMAP_KEY?.trim();
    let isMounted = true;

    if (!appKey) return undefined;

    loadKakaoMaps(appKey)
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const center = new maps.LatLng(37.5446, 127.0559);
        const map = new maps.Map(mapContainerRef.current, {
          center,
          level: 4,
          mapTypeId: maps.MapTypeId.ROADMAP,
        });
        mapRef.current = map;

        const sampleLocations = [
          { number: "01", lat: 37.5460, lng: 127.0546 },
          { number: "02", lat: 37.5432, lng: 127.0574 },
          { number: "03", lat: 37.5465, lng: 127.0580 },
        ];
        sampleLocations.forEach(({ number, lat, lng }) => {
          const element = document.createElement("span");
          element.className = "kakao-sample-marker";
          element.textContent = number;
          new maps.CustomOverlay({
            map,
            position: new maps.LatLng(lat, lng),
            content: element,
            yAnchor: 0.5,
          });
        });

        const currentCoordinates = locationCoordinatesRef.current;
        if (currentCoordinates) {
          const position = new maps.LatLng(currentCoordinates.latitude, currentCoordinates.longitude);
          const currentLocationElement = document.createElement("span");
          currentLocationElement.className = "kakao-current-location-marker";
          userMarkerRef.current = new maps.CustomOverlay({
            map,
            position,
            content: currentLocationElement,
            yAnchor: 0.5,
          });
          map.setCenter(position);
        }

        setMapStatus("ready");
      })
      .catch(() => {
        if (isMounted) setMapStatus("error");
      });

    return () => {
      isMounted = false;
      mapRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!locationCoordinates || !mapRef.current || !window.kakao?.maps) return;
    const position = new window.kakao.maps.LatLng(
      locationCoordinates.latitude,
      locationCoordinates.longitude,
    );
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(position);
    } else {
      const marker = document.createElement("span");
      marker.className = "kakao-current-location-marker";
      userMarkerRef.current = new window.kakao.maps.CustomOverlay({
        map: mapRef.current,
        position,
        content: marker,
        yAnchor: 0.5,
      });
    }
    mapRef.current.panTo(position);
  }, [locationCoordinates]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecentNotices() {
      if (!supabase) {
        setNoticeStatus("error");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("notices")
          .select("id, title, content, is_pinned, created_at, image_paths")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        if (!isMounted) return;
        setRecentNotices(data ?? []);
        setNoticeStatus("loaded");
      } catch {
        if (isMounted) setNoticeStatus("error");
      }
    }

    loadRecentNotices();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlaces = useMemo(
    () =>
      places.filter((place) => {
        const matchesCategory =
          category === "전체" || place.category === category;
        const matchesQuery = `${place.name} ${place.kind}`.includes(
          query.trim(),
        );
        return matchesCategory && matchesQuery;
      }),
    [category, query],
  );

  const findMe = () => {
    if (!navigator.geolocation) {
      setMessage("이 브라우저에서는 현재 위치를 확인할 수 없어요.");
      return;
    }
    setMessage("현재 위치를 확인하고 있어요.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = { latitude: coords.latitude, longitude: coords.longitude };
        locationCoordinatesRef.current = coordinates;
        setLocationCoordinates(coordinates);
        setLocation(
          `${coords.latitude.toFixed(3)}°, ${coords.longitude.toFixed(3)}°`,
        );
        setMessage("내 주변 장소를 찾았어요.");
      },
      () =>
        setMessage(
          "위치 권한을 확인해 주세요. 성수동 주변을 먼저 보여드릴게요.",
        ),
      { timeout: 8000 },
    );
  };

  return (
    <main>
      <SiteHeader variant="home" />

      <section className="hero page-wrap" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR NEIGHBORHOOD, CLOSER
          </p>
          <h1>
            오늘의 동네를
            <br />한 걸음 <em>가까이.</em>
          </h1>
          <p className="hero-description">
            지금 내 곁에 있는 좋은 장소들.
            <br className="desktop-break" /> 멀리 찾지 않아도, 오늘의 취향은
            가까이에 있어요.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="/product">
              내 주변 발견하기 <Arrow />
            </a>
            <button className="text-button" onClick={findMe}>
              현재 위치 사용 <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="hero-proof">
            <span className="proof-marker" aria-hidden="true">L</span>
            <p>
              <strong>가까운 동네부터</strong> 새로운 장소를 발견해 보세요
            </p>
          </div>
        </div>

        <div className="hero-visual" role="region" aria-label="성수동 주변 카카오 지도">
          <div className="map-topline">
            <span className="map-live">
            <i /> NEIGHBORHOOD PREVIEW
            </span>
            <button className="map-location" onClick={findMe}>
              <span className="target-icon">◎</span>
              {location}
            </button>
          </div>
          <div className="map-canvas" ref={mapContainerRef}>
            {mapStatus !== "ready" && (
              <div className="map-status" role="status">
                {mapStatus === "loading" && "지도를 불러오고 있습니다."}
                {mapStatus === "missing-key" && "카카오 지도 키를 설정해 주세요."}
                {mapStatus === "error" && "지도를 불러오지 못했습니다. 카카오 JavaScript 키와 등록 도메인을 확인해 주세요."}
              </div>
            )}
          </div>
          <div className="map-caption">
            <div>
              <span className="caption-kicker">위치 기반 탐색 미리보기</span>
              <strong>{locationCoordinates ? "현재 위치 주변을 둘러보세요" : "성수동 주변을 둘러보세요"}</strong>
            </div>
            <span className="map-scale">핀은 예시 위치입니다</span>
          </div>
          <div className="floating-note">
            <span className="note-icon">✳</span>
            <span>
              <b>동네 탐색 예시</b>
              <small>가까운 장소를 둘러보세요</small>
            </span>
            <Arrow diagonal />
          </div>
        </div>
        <div className="hero-index">
          <span>01 / 03</span>
          <span className="index-line" />
          <span>LOCAL, BUT PERSONAL</span>
        </div>
      </section>

      <section className="discover section-wrap" id="product">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LITTLE CLOSER</p>
            <h2>
              지금, 내 주변의 <em>좋은 것들.</em>
            </h2>
          </div>
          <p className="section-aside">
            광고보다 취향을 먼저.
            <br />
            당신의 반경 안에서 발견해요.
          </p>
        </div>
        <div className="discover-toolbar">
          <div className="category-tabs" role="tablist" aria-label="장소 종류">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
                role="tab"
                aria-selected={category === item}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="장소 검색"
              placeholder="장소나 취향을 검색해보세요"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
        </div>
        {message && (
          <p className="location-message" role="status">
            {message}
          </p>
        )}
        <div className="place-grid">
          {filteredPlaces.map((place, index) => (
            <article
              className={`place-card place-${place.tone}`}
              key={place.name}
            >
              <div className="place-art">
                <span className="place-number">0{index + 1}</span>
                <span className="place-tag">{place.tag}</span>
                <div className={`art-shape shape-${place.tone}`}>
                  <i />
                  <i />
                  <i />
                </div>
                <span className="art-word">
                  {place.category === "카페"
                    ? "slow\ndown"
                    : place.category === "문화"
                      ? "small\nthings"
                      : "good\ntaste"}
                </span>
              </div>
              <div className="place-info">
                <div>
                  <span className="place-kind">{place.kind}</span>
                  <h3>{place.name}</h3>
                </div>
                <span className="place-rating">✳ {place.rating}</span>
              </div>
              <div className="place-meta">
                <span>{place.distance}</span>
                <span>{place.time}</span>
                <button
                  aria-label={`${place.name} 자세히 보기`}
                  onClick={() =>
                    setMessage(
                      `${place.name} · ${place.distance} 거리에 있어요.`,
                    )
                  }
                >
                  <Arrow diagonal />
                </button>
              </div>
            </article>
          ))}
          {filteredPlaces.length === 0 && (
            <div className="empty-state">
              찾는 장소가 아직 없어요. 다른 키워드로 찾아보세요.
            </div>
          )}
        </div>
        <div className="discover-foot">
          <span>장소·거리·평점은 화면 구성용 예시입니다</span>
          <a href="/company">
            로컬릿의 장소 큐레이션 <Arrow diagonal />
          </a>
        </div>
      </section>

      <section className="recent-notices section-wrap" aria-labelledby="recent-notices-title">
        <div className="recent-notices-heading">
          <div>
            <p className="eyebrow">WHAT'S NEW</p>
            <h2 id="recent-notices-title">로컬릿의 <em>새로운 소식.</em></h2>
          </div>
          <a className="recent-notices-more" href="/notices">
            공지사항 전체 보기 <Arrow />
          </a>
        </div>
        {noticeStatus === "loading" ? (
          <p className="recent-notices-state" role="status">새로운 소식을 불러오고 있습니다.</p>
        ) : noticeStatus === "error" ? (
          <p className="recent-notices-state" role="status">
            공지사항을 불러오지 못했습니다. <a href="/notices">공지사항 페이지에서 확인해 주세요.</a>
          </p>
        ) : recentNotices.length === 0 ? (
          <p className="recent-notices-state">아직 등록된 공지사항이 없습니다.</p>
        ) : (
          <div className="recent-notice-grid">
            {recentNotices.map((notice, index) => {
              const thumbnail = notice.image_paths?.[0];
              return (
                <a className="recent-notice-card" href="/notices" key={notice.id}>
                  <div className={`recent-notice-art notice-art-${index + 1}`}>
                    {thumbnail ? (
                      <img src={supabase.storage.from("notice-images").getPublicUrl(thumbnail).data.publicUrl} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden="true">L<span>.</span></span>
                    )}
                    {notice.is_pinned && <span className="recent-notice-pinned">중요 안내</span>}
                    <span className="recent-notice-art-index">UPDATE · {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="recent-notice-copy">
                    <time dateTime={notice.created_at}>{formatNoticeDate(notice.created_at)}</time>
                    <h3>{notice.title}</h3>
                    <p>{notice.content}</p>
                    <span className="recent-notice-link">자세히 보기 <Arrow diagonal /></span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      <section className="manifesto" id="company">
        <div className="manifesto-inner section-wrap">
          <p className="eyebrow">A GOOD PLACE IS CLOSER THAN YOU THINK</p>
          <h2>
            동네를 바꾸는 건<br />
            <em>거창한 계획이 아니라</em>
            <br />
            작은 발견 하나니까.
          </h2>
          <div className="manifesto-bottom">
            <p>
              로컬릿은 유명한 곳보다 당신에게 맞는 곳을 찾습니다.
              <br />집 앞 한 블록의 새로운 이유를 만나보세요.
            </p>
            <a className="button button-light" href="/product">
              제품 둘러보기 <Arrow />
            </a>
            <span className="manifesto-stamp">
              LOCAL
              <br />
              MATTERS
              <br />
              <b>SEOUL · 2025</b>
            </span>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-inner section-wrap">
          <div className="contact-copy">
            <p className="eyebrow">LET'S TALK LOCAL</p>
            <h2>동네에 대한 생각,<br /><em>로컬릿에 들려주세요.</em></h2>
            <p>제휴 제안, 서비스 문의, 동네 이야기를 남겨주세요.<br />아래 양식은 현재 시안이며 문의가 실제로 전송되지는 않습니다.</p>
            <span className="contact-note">실제 문의 접수는 전송 기능이 연결된 뒤 이용하실 수 있습니다.</span>
          </div>
          <form className="inquiry-form" onSubmit={(event) => {
            event.preventDefault();
            setInquiryMessage("문의 내용을 작성했습니다. 실제 전송 기능은 아직 연결되지 않았습니다.");
          }}>
            <label>이름<input name="name" autoComplete="name" placeholder="성함을 입력해 주세요" required /></label>
            <label>이메일<input name="email" type="email" autoComplete="email" placeholder="답변받을 이메일 주소" required /></label>
            <label>문의 유형<select name="topic" defaultValue="제휴 문의"><option>제휴 문의</option><option>서비스 문의</option><option>동네 제보</option><option>기타</option></select></label>
            <label>문의 내용<textarea name="message" rows="4" placeholder="궁금한 점이나 제안하고 싶은 내용을 적어주세요" required /></label>
            <button className="button button-dark" type="submit">문의 내용 확인하기 <Arrow /></button>
            {inquiryMessage && <p className="form-status" role="status">{inquiryMessage}</p>}
          </form>
        </div>
      </section>

      <section className="story-strip section-wrap" id="community">
        <div>
          <p className="eyebrow">NOT JUST A PLACE</p>
          <h2>
            동네에 쌓이는
            <br />
            <em>작은 이야기들.</em>
          </h2>
        </div>
        <blockquote>
          “익숙한 길에서
          <br />새로운 동네를 발견하는 순간.”
          <footer>
            <span>
              <b>로컬릿 커뮤니티</b>
              <small>동네 이야기 예시</small>
            </span>
          </footer>
        </blockquote>
        <div className="story-stat">
          <strong>
            LOCAL<span>·</span>
          </strong>
          <p>
            동네에서 만나는
            <br />
            새로운 이야기
          </p>
          <span className="stat-rule" />
        </div>
      </section>

      <footer className="site-footer page-wrap">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <i />
          </span>
          로컬릿<span className="brand-period">.</span>
        </a>
        <span>좋은 하루는 가까이에.</span>
        <div>
          <a href="/company">회사 소개</a>
          <a href="/product">제품 소개</a>
          <a href="/contact">온라인 문의</a>
          <a href="/community">커뮤니티</a>
          <a href="/notices">공지사항</a>
        </div>
        <small>© 2025 LOCALIT. ALL RIGHTS RESERVED.</small>
      </footer>
    </main>
  );
}

function App() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";

  useEffect(() => {
    const pageTitles = {
      "/": "오늘의 동네를 한 걸음 가까이",
      "/company": "회사 소개",
      "/product": "제품 소개",
      "/contact": "온라인 문의",
      "/community": "커뮤니티",
      "/notices": "공지사항",
      "/login": "로그인",
      "/signup": "회원가입",
      "/mypage": "마이페이지",
    };
    document.title = `${pageTitles[pathname] ?? pageTitles["/"]} | 로컬릿`;
  }, [pathname]);

  switch (pathname) {
    case "/company":
      return <CompanyPage />;
    case "/product":
      return <ProductPage />;
    case "/contact":
      return <ContactPage />;
    case "/community":
      return <CommunityPage />;
    case "/notices":
      return <NoticePage />;
    case "/login":
      return <LoginPage />;
    case "/signup":
      return <SignupPage />;
    case "/mypage":
      return <MyPage />;
    default:
      return <HomePage />;
  }
}

export default App;
