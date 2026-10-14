import { Arrow, PageFrame, PageHeading } from '../components/site/InteriorLayout.jsx';

export function CompanyPage() {
  return (
    <PageFrame active="company">
      <PageHeading
        eyebrow="ABOUT LOCALIT"
        number="01"
        title={
          <>
            동네의 좋은 순간을
            <br />
            <em>더 가까이 연결합니다.</em>
          </>
        }
        lead="익숙한 거리에서 새로운 장소를 발견하고, 동네와 조금 더 다정한 관계를 맺도록 돕습니다."
      />
      <main className="interior-container interior-content">
        <section className="company-statement">
          <p className="interior-eyebrow">WHY WE ARE HERE</p>
          <h2>
            좋은 장소는 멀리 있지 않아요.
            <br />
            아직 만나지 못했을 뿐.
          </h2>
          <p>
            로컬릿은 동네를 살아가는 사람의 시선으로 주변을 살핍니다. 인기
            순위만 따라가기보다, 지금의 나에게 맞는 가까운 장소를 발견하는 일을
            돕고 싶습니다.
          </p>
        </section>
        <section className="company-values" aria-label="로컬릿의 기준">
          <article>
            <span>01</span>
            <h3>가까운 발견</h3>
            <p>
              멀리 이동하지 않아도 새로운 하루가 시작될 수 있도록 주변을
              살펴봅니다.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>사람의 취향</h3>
            <p>
              숫자와 순위에 앞서, 장소가 가진 분위기와 각자의 취향을 생각합니다.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>동네의 연결</h3>
            <p>
              작은 가게와 동네를 찾는 사람이 자연스럽게 이어지는 경험을
              만듭니다.
            </p>
          </article>
        </section>
        <section className="interior-cta-band">
          <div>
            <p className="interior-eyebrow">START A LITTLE CLOSER</p>
            <h2>오늘의 동네를 둘러볼까요?</h2>
          </div>
          <a className="interior-button" href="/product">
            제품 소개 보기 <Arrow />
          </a>
        </section>
      </main>
    </PageFrame>
  );
}
