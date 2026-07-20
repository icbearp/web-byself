const navItems = ["文章", "调研", "服务", "工具", "联系"];

const topics = [
  {
    label: "乐道 / 蔚来购车",
    title: "从用车场景出发，而不是从配置表出发",
    copy: "试驾前先帮你梳理通勤、家庭、预算、补能和保值预期，再把适合与不适合讲清楚。",
  },
  {
    label: "AI效率工具",
    title: "把新工具变成每天少折腾一点",
    copy: "分享我自己验证过的提示词、工作流、资料整理和自动化方法，不追热点，只留能复用的。",
  },
  {
    label: "信息获取",
    title: "更自由地看世界，也更谨慎地做判断",
    copy: "记录翻墙、订阅源、英文资料阅读和信息安全经验，强调合规、隐私与独立判断。",
  },
  {
    label: "生活与人生建议",
    title: "普通人的复利，来自好好选择",
    copy: "关于销售、关系、金钱、情绪和长期主义的观察，尽量写得真诚、具体、有用。",
  },
];

const services = [
  "乐道车型咨询与试驾预约",
  "蔚来生态、换电和补能体验说明",
  "家庭购车需求梳理与预算建议",
  "提车流程、用车习惯和售后答疑",
];

const notes = [
  "怎样判断一辆车是否适合你的真实生活",
  "AI工具不是魔法，是把重复思考流程化",
  "信息差会赚钱，也会让人做错决定",
];

const retailPrinciples = [
  {
    title: "弱化属性，放大利益",
    copy: "少讲高算力、冰箱、座舱参数，多讲它如何改变周末露营、家庭出行、补能安排和车内陪伴。",
  },
  {
    title: "贩卖生态粘性",
    copy: "用户买的不是一辆孤立的车，而是换电网络、车机互联、服务社群和智能周边组成的出行生态。",
  },
  {
    title: "销售变成同行者",
    copy: "真正有信任感的顾问，不急着说服用户，而是帮用户把生活痛点、预算边界和长期体验看清楚。",
  },
];

const researchSteps = [
  "明确对标对象：Apple Store、NIO House、乐道门店、理想零售空间。",
  "化身神秘客：观察第一句话问预算，还是问你的真实使用场景。",
  "访谈真实用户：追问他们买单是因为话术，还是因为体验到了生活价值。",
  "拆解组织机制：了解员工是否背个人销售KPI，以及满意度、社群活跃度如何影响激励。",
];

export default function Home() {
  return (
    <main>
      <header className="site-header" aria-label="主导航">
        <a className="brand" href="#top" aria-label="周多福首页">
          <span className="brand-mark">周</span>
          <span>
            <strong>周多福</strong>
            <small>乐道汽车销售 | 经验博客</small>
          </span>
        </a>
        <nav>
          {navItems.map((item) => (
            <a href={`#${item}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">蔚来乐道汽车销售顾问 · 独立经验博客</p>
          <h1>把购车、效率和生活经验讲明白。</h1>
          <p className="hero-text">
            我是周多福。这个站点不是一张名片，而是一间长期更新的工作室：
            你可以在这里看到真实购车建议、AI效率工具、信息获取方法，也可以直接找我聊乐道和蔚来的用车选择。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#联系">
              预约一次购车沟通
            </a>
            <a className="secondary-action" href="#文章">
              先看看我写什么
            </a>
          </div>
        </div>

        <div className="hero-panel" aria-label="周多福独立站视觉卡片">
          <img src="/og.png" alt="周多福独立站视觉预览" />
          <div className="signal-card">
            <span>我的判断标准</span>
            <strong>不催单，先把问题问对。</strong>
          </div>
        </div>
      </section>

      <section className="intro-band" aria-label="价值承诺">
        <p>
          我希望每一次咨询都让你少走一点弯路：买车时少被话术带跑，学习工具时少被噱头消耗，
          做人生选择时多一点清醒和底气。
        </p>
      </section>

      <section className="section" id="文章">
        <div className="section-heading">
          <p className="eyebrow">What I write</p>
          <h2>四个长期栏目</h2>
        </div>
        <div className="topic-grid">
          {topics.map((topic) => (
            <article className="topic-card" key={topic.label}>
              <span>{topic.label}</span>
              <h3>{topic.title}</h3>
              <p>{topic.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section research-section" id="调研">
        <div className="research-lead">
          <p className="eyebrow">Retail research</p>
          <h2>把 Apple Store 的顾问式体验，迁移到汽车与科技零售。</h2>
          <p>
            我会持续研究一种更舒服的销售方式：去推销化、重生态体验、用生活场景解释产品价值。
            它的底层逻辑不是话术漂亮，而是让用户在门店里感觉自己被理解、被帮助、被尊重。
          </p>
        </div>

        <div className="principle-grid" aria-label="顾问式零售三大核心">
          {retailPrinciples.map((item, index) => (
            <article className="principle-card" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>

        <div className="research-playbook">
          <div>
            <p className="eyebrow">Mystery shopper playbook</p>
            <h3>怎么调研一家门店是否真的“不推销”？</h3>
          </div>
          <ol>
            {researchSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section service-section" id="服务">
        <div>
          <p className="eyebrow">For car buyers</p>
          <h2>如果你正在看乐道或蔚来，我能帮你把选择变简单。</h2>
          <p>
            购车咨询不该只剩价格和权益。我更关心你的日常路线、停车条件、家庭成员、
            长途频率和真实预算，再一起判断哪种方案值得。
          </p>
        </div>
        <ul className="service-list">
          {services.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </section>

      <section className="section tool-section" id="工具">
        <div className="section-heading">
          <p className="eyebrow">Practical notes</p>
          <h2>我会优先写这些具体问题</h2>
        </div>
        <div className="note-strip">
          {notes.map((note, index) => (
            <article key={note}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="联系">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>想看车、想试驾，或者想交流工具和成长，都可以从这里开始。</h2>
        </div>
        <a className="primary-action" href="mailto:hello@zhouduofu.com">
          发邮件给周多福
        </a>
      </section>
    </main>
  );
}
