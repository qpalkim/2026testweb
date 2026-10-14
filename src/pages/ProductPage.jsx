import { useMemo, useState } from 'react';
import { Arrow, PageFrame, PageHeading } from '../components/site/InteriorLayout.jsx';

const placeSamples = [
  {
    name: "모노키친",
    type: "브런치 · 양식",
    area: "성수동",
    category: "식사",
    note: "천천히 즐기는 아침 식사",
    color: "clay",
  },
  {
    name: "페이지오프",
    type: "커피 · 디저트",
    area: "성수동",
    category: "카페",
    note: "오래 머물기 좋은 작은 카페",
    color: "leaf",
  },
  {
    name: "온기서점",
    type: "독립서점 · 문구",
    area: "서울숲",
    category: "문화",
    note: "책과 동네를 함께 만나는 곳",
    color: "stone",
  },
];


export function ProductPage() {
  const [category, setCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [selectedArea, setSelectedArea] = useState("서울 성수동");
  const filtered = useMemo(
    () =>
      placeSamples.filter(
        (place) =>
          (category === "전체" || category === place.category) &&
          `${place.name} ${place.type} ${place.area}`.includes(query.trim()),
      ),
    [category, query],
  );

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationMessage("이 브라우저에서는 현재 위치를 확인할 수 없습니다.");
      return;
    }
    setLocationMessage("현재 위치를 확인하고 있습니다.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelectedArea(
          `${coords.latitude.toFixed(3)}°, ${coords.longitude.toFixed(3)}°`,
        );
        setLocationMessage(
          "좌표를 확인했습니다. 실제 주변 장소 검색은 아직 연결되지 않았습니다.",
        );
      },
      () =>
        setLocationMessage(
          "위치 권한을 확인해 주세요. 성수동 예시를 계속 볼 수 있습니다.",
        ),
      { timeout: 8000 },
    );
  }

  return (
    <PageFrame active="product">
      <PageHeading
        eyebrow="MEET THE PRODUCT"
        number="02"
        title={
          <>
            가까운 곳에서 찾는
            <br />
            <em>오늘의 취향.</em>
          </>
        }
        lead="지금 있는 곳 주변의 식사, 카페, 문화 공간을 한곳에서 둘러보세요."
      />
      <main className="interior-container interior-content product-content">
        <section className="product-search-panel">
          <div>
            <p className="interior-eyebrow">EXPLORE NEAR YOU</p>
            <h2>어디를 발견하고 싶으세요?</h2>
            <p className="product-area">
              <span className="location-dot" />
              {selectedArea}
              <button onClick={locateUser}>현재 위치 사용</button>
            </p>
          </div>
          <label className="product-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="장소, 종류, 동네 검색"
              aria-label="장소, 종류, 동네 검색"
            />
          </label>
        </section>
        {locationMessage && (
          <p className="product-status" role="status">
            {locationMessage}
          </p>
        )}
        <div className="product-toolbar">
          <div
            className="product-tabs"
            role="tablist"
            aria-label="장소 카테고리"
          >
            {["전체", "식사", "카페", "문화"].map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={category === item ? "selected" : ""}
                role="tab"
                aria-selected={category === item}
              >
                {item}
              </button>
            ))}
          </div>
          <span>장소 데이터는 화면 구성용 예시입니다.</span>
        </div>
        <section className="product-card-grid" aria-label="예시 장소 목록">
          {filtered.map((place, index) => (
            <article
              className={`product-place-card ${place.color}`}
              key={place.name}
            >
              <div className="product-art">
                <span>0{index + 1}</span>
                <i />
                <b>{place.category}</b>
              </div>
              <div className="product-place-copy">
                <p>
                  {place.area} · {place.type}
                </p>
                <h3>{place.name}</h3>
                <span>{place.note}</span>
              </div>
              <a href="/contact" aria-label={`${place.name} 정보 문의하기`}>
                <Arrow diagonal />
              </a>
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="product-empty">
              검색 결과가 없습니다. 다른 단어로 다시 찾아보세요.
            </p>
          )}
        </section>
        <section className="product-how">
          <div>
            <p className="interior-eyebrow">A SIMPLE WAY TO FIND</p>
            <h2>
              찾고, 둘러보고,
              <br />
              <em>동네와 가까워지기.</em>
            </h2>
          </div>
          <ol>
            <li>
              <b>01</b>
              <span>관심 있는 동네나 현재 위치를 선택합니다.</span>
            </li>
            <li>
              <b>02</b>
              <span>장소 유형과 검색어로 선택지를 좁힙니다.</span>
            </li>
            <li>
              <b>03</b>
              <span>마음에 드는 장소를 살펴보고 방문을 계획합니다.</span>
            </li>
          </ol>
        </section>
      </main>
    </PageFrame>
  );
}
