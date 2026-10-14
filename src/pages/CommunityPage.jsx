import { Arrow, PageFrame, PageHeading } from '../components/site/InteriorLayout.jsx';

const communityIdeas = [
  {
    number: "01",
    category: "동네 가게",
    title: "자주 가는 곳에는\n나만 아는 이유가 있어요.",
    text: "오래 머물고 싶은 가게의 분위기와 그곳에서 보낸 시간을 나눠보세요.",
    color: "idea-clay",
  },
  {
    number: "02",
    category: "산책의 발견",
    title: "한 블록 돌아가다\n만난 풍경.",
    text: "늘 걷던 길에서 새롭게 보인 작은 풍경을 기록해 보세요.",
    color: "idea-leaf",
  },
  {
    number: "03",
    category: "동네의 취향",
    title: "오늘의 동네를\n좋아하게 된 순간.",
    text: "당신의 취향이 머무는 장소와 동네 이야기를 들려주세요.",
    color: "idea-stone",
  },
];

export function CommunityPage() {
  return (
    <PageFrame active="community">
      <PageHeading
        eyebrow="LOCALIT COMMUNITY"
        number="04"
        title={
          <>
            동네를 좋아하는 마음,
            <br />
            <em>함께 나눠요.</em>
          </>
        }
        lead="좋은 장소와 그곳에서 보낸 순간을 기록하고, 서로의 동네를 발견하는 공간입니다."
      />
      <main className="interior-container interior-content community-content">
        <div className="community-notice">
          <span className="community-notice-mark">L</span>
          <div>
            <b>커뮤니티를 준비하고 있습니다.</b>
            <p>
              현재 게시글과 회원 기능은 운영하지 않습니다. 아래 주제는 동네
              이야기를 나누기 위한 예시입니다.
            </p>
          </div>
        </div>
        <div className="community-heading">
          <div>
            <p className="interior-eyebrow">A PLACE FOR LOCAL STORIES</p>
            <h2>어떤 이야기를 남기고 싶으세요?</h2>
          </div>
          <span>STORIES START CLOSE</span>
        </div>
        <section className="community-ideas">
          {communityIdeas.map((idea) => (
            <article
              className={`community-idea ${idea.color}`}
              key={idea.number}
            >
              <span className="idea-number">{idea.number}</span>
              <p>{idea.category}</p>
              <h3>{idea.title}</h3>
              <span className="idea-description">{idea.text}</span>
              <span className="idea-orb" />
            </article>
          ))}
        </section>
        <section className="community-invite">
          <div>
            <p className="interior-eyebrow">YOUR NEIGHBORHOOD, YOUR STORY</p>
            <h2>
              첫 번째 동네 이야기를
              <br />
              <em>로컬릿에 들려주세요.</em>
            </h2>
          </div>
          <a className="interior-button" href="/contact">
            온라인 문의하기 <Arrow />
          </a>
        </section>
      </main>
    </PageFrame>
  );
}
