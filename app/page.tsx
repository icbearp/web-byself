"use client";

import { useMemo, useState } from "react";

type ModelKey = "l60" | "l80" | "l90";
type PurchaseMode = "vehicle" | "baas";
type ScenarioKey = "commute" | "kids" | "travel" | "parents";

type Trim = {
  name: string;
  vehiclePrice: number;
  baasPrice: number;
  tag: string;
  bestFor: string;
};

type KnownOption = {
  id: string;
  label: string;
  price: number;
  note: string;
  models: ModelKey[];
  excludedTrim?: string;
};

const navItems = [
  { label: "车型", href: "#models" },
  { label: "价格计算", href: "#calculator" },
  { label: "场景", href: "#scenarios" },
  { label: "亮点", href: "#highlights" },
  { label: "联系", href: "#contact" },
];

const models: Record<
  ModelKey,
  {
    name: string;
    subtitle: string;
    headline: string;
    image: string;
    officialUrl: string;
    sourceLabel: string;
    trims: Trim[];
    highlights: string[];
    lifestyle: string;
    advisorNote: string;
  }
> = {
  l60: {
    name: "乐道 L60",
    subtitle: "家庭智能电动 SUV",
    headline: "适合把通勤、接送、周末出游放在同一辆车里解决的家庭。",
    image: "https://image.nio.com/onvo-site/home/l60-kv.jpg",
    officialUrl: "https://www.onvo.cn/l60",
    sourceLabel: "官网车型页与 2026 款焕新信息",
    trims: [
      {
        name: "Pro",
        vehiclePrice: 192800,
        baasPrice: 135800,
        tag: "入门够用",
        bestFor: "预算清晰、主要城市通勤和短途家庭出行。",
      },
      {
        name: "Max",
        vehiclePrice: 202800,
        baasPrice: 145800,
        tag: "均衡推荐",
        bestFor: "想要更完整舒适体验，又不追求一步到顶。",
      },
      {
        name: "Ultra",
        vehiclePrice: 222800,
        baasPrice: 165800,
        tag: "配置拉满",
        bestFor: "经常带家人长途，重视后排陪伴和娱乐体验。",
      },
    ],
    highlights: [
      "全系基于 900V 高压架构，主打更高效的补能和能耗表现。",
      "后排舒享娱乐套装在 Ultra 版标配，Pro/Max 可按需求选装。",
      "更像一台日常家用车：重点不是炫参数，而是接送、购物、露营都少折腾。",
    ],
    lifestyle:
      "如果你每天在城市里跑固定路线，周末偶尔带孩子去近郊，L60 是最容易解释预算的一台：尺寸不压迫，价格门槛低，换电体系也能缓解里程焦虑。",
    advisorNote:
      "我的建议是先把停车位、常坐人数、后排娱乐需求问清楚。预算紧就从 Pro/Max 看起，后排体验是刚需再把选装或 Ultra 放进比较。",
  },
  l80: {
    name: "乐道 L80",
    subtitle: "智能双舱大五座旗舰 SUV",
    headline: "给重视空间、装载和舒适体验的五口之家准备的大五座方案。",
    image: "https://image.nio.com/onvo-site/l80/kv/kv-pc.jpg",
    officialUrl: "https://www.onvo.cn/l80",
    sourceLabel: "官网车型页与 2026 年 5 月上市信息",
    trims: [
      {
        name: "Pro",
        vehiclePrice: 242800,
        baasPrice: 156800,
        tag: "大五座入门",
        bestFor: "刚需大五座空间，但预算仍希望可控。",
      },
      {
        name: "Max",
        vehiclePrice: 259800,
        baasPrice: 173800,
        tag: "家庭主力",
        bestFor: "多数家庭最值得重点试驾的版本。",
      },
      {
        name: "Ultra",
        vehiclePrice: 279800,
        baasPrice: 193800,
        tag: "高配舒适",
        bestFor: "老人孩子常坐第二排，长途舒适优先。",
      },
    ],
    highlights: [
      "官方定位智能双舱大五座旗舰 SUV，重点解决空间与装载的日常痛点。",
      "上市权益中提到多个舒适配置高价值标配，适合讲家庭体验而不是只讲清单。",
      "BaaS 方案门槛明显下降，适合先算首付压力再看长期用车成本。",
    ],
    lifestyle:
      "L80 的意义不是简单变大，而是把家庭生活装得更从容：婴儿车、骑行装备、露营用品和日常采购，都能在双舱空间里各得其所。",
    advisorNote:
      "建议试驾时直接带上家庭成员，重点体验前备舱、后备舱、二排舒适度和装载灵活性，模拟一次真实的家庭出行。",
  },
  l90: {
    name: "乐道 L90",
    subtitle: "家庭旗舰大三排 SUV",
    headline: "适合把车当成家庭移动客厅，也在意体面、空间和长途效率的人。",
    image: "https://image.nio.com/onvo-site/l90/kv/kv-pc.jpg",
    officialUrl: "https://www.onvo.cn/l90",
    sourceLabel: "官网车型页与 2026 年 4 月上市信息",
    trims: [
      {
        name: "Pro",
        vehiclePrice: 265800,
        baasPrice: 179800,
        tag: "旗舰门槛",
        bestFor: "想要 L90 空间气场，预算也要稳住。",
      },
      {
        name: "Max",
        vehiclePrice: 289800,
        baasPrice: 193800,
        tag: "高频推荐",
        bestFor: "大家庭长途频率高，希望舒适和智能都更完整。",
      },
      {
        name: "Ultra",
        vehiclePrice: 299800,
        baasPrice: 213800,
        tag: "一步到位",
        bestFor: "第二排体验、座舱氛围和家人满意度优先。",
      },
    ],
    highlights: [
      "官方强调「6 人 10 箱」和 240L 智能电动前备舱，适合多人满载旅行。",
      "采用 900V 高压架构，上市信息披露 CLTC 综合续航最高 605km。",
      "更适合把全家人的舒适都放进决策，而不是只看驾驶者一个人的感受。",
    ],
    lifestyle:
      "如果你经常全家出远门，L90 会把很多争论变少：谁坐哪、箱子放哪、老人会不会累、孩子路上怎么待得住，这些都是大车真正的价值。",
    advisorNote:
      "看 L90 时别只问最低价，要问满员满载是否舒服、停车是否有压力、家里谁最常坐二排。答案比配置表更接近真实选择。",
  },
};

const knownOptions: KnownOption[] = [
  {
    id: "l60-rear-entertainment",
    label: "后排舒享娱乐套装",
    price: 10000,
    note: "官网披露该套装价格为 10,000 元；L60 Ultra 已标配。",
    models: ["l60"],
    excludedTrim: "Ultra",
  },
];

const scenarios: Record<
  ScenarioKey,
  {
    label: string;
    title: string;
    model: ModelKey;
    story: string;
    checklist: string[];
  }
> = {
  commute: {
    label: "通勤+接送",
    title: "工作日像闹钟一样准时，车要帮你省心。",
    model: "l60",
    story:
      "每天固定路线上下班、接孩子、买菜，最怕的是停车难、充电焦虑和车机不好用。这个场景先看 L60，再判断是否需要后排娱乐套装。",
    checklist: ["车位尺寸", "每日通勤里程", "孩子是否常坐后排", "附近换电/补能便利度"],
  },
  kids: {
    label: "二孩家庭",
    title: "不只多一个座位，而是少很多家庭摩擦。",
    model: "l90",
    story:
      "两个安全座椅、老人同乘、婴儿车和书包一起上车，L90 的六座或七座布局会比纸面参数更有说服力。试驾时一定要模拟真实座位分配。",
    checklist: ["6 座或 7 座", "第三排进出", "安全座椅位置", "满员后备厢"],
  },
  travel: {
    label: "长途旅行",
    title: "长途不是拼忍耐，是让每个人都还有余量。",
    model: "l90",
    story:
      "一年有几次跨城、露营或返乡，车就不能只服务驾驶者。L90 的重点是满载空间、前备舱、二三排舒适和补能路线。",
    checklist: ["满载行李", "老人乘坐时长", "高速补能规划", "露营/运动装备"],
  },
  parents: {
    label: "带父母出行",
    title: "好车感，往往来自上下车和坐久了不累。",
    model: "l80",
    story:
      "父母不一定关心智驾和算力，但会立刻感受到座椅、踏板、车内安静和上下车姿态。L80/L90 都值得看，先由车位和预算决定。",
    checklist: ["上下车便利", "第二排坐姿", "晕车敏感度", "空调和座椅舒适"],
  },
};

const experienceNotes = [
  {
    title: "先讲生活，再讲配置",
    copy: "比如同样是大屏和音响，对带娃家庭是安抚孩子，对长途用户是降低疲劳，对通勤用户可能反而不是优先项。",
  },
  {
    title: "把价格拆成两条线",
    copy: "整车购买看总价和保值预期；BaaS 看首购压力和长期月付。两条线都算完，心里才有真实边界。",
  },
  {
    title: "试驾要带问题去",
    copy: "别只绕一圈。把安全座椅、老人坐姿、停车压力、后备厢装备、换电路线这些真实问题带进门店。",
  },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<ModelKey>("l60");
  const [selectedTrim, setSelectedTrim] = useState("Max");
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("vehicle");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customBudget, setCustomBudget] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("commute");

  const currentModel = models[selectedModel];
  const currentTrim =
    currentModel.trims.find((trim) => trim.name === selectedTrim) ??
    currentModel.trims[0];

  const visibleOptions = knownOptions.filter((option) =>
    option.models.includes(selectedModel),
  );

  const optionTotal = useMemo(() => {
    return visibleOptions.reduce((total, option) => {
      const excluded = option.excludedTrim === currentTrim.name;
      if (excluded || !selectedOptions.includes(option.id)) {
        return total;
      }
      return total + option.price;
    }, 0);
  }, [currentTrim.name, selectedOptions, visibleOptions]);

  const basePrice =
    purchaseMode === "vehicle"
      ? currentTrim.vehiclePrice
      : currentTrim.baasPrice;
  const estimateTotal = basePrice + optionTotal + customBudget;

  function chooseModel(modelKey: ModelKey) {
    setSelectedModel(modelKey);
    setSelectedTrim(models[modelKey].trims[1]?.name ?? models[modelKey].trims[0].name);
    setSelectedOptions([]);
    setCustomBudget(0);
  }

  function toggleOption(option: KnownOption) {
    if (option.excludedTrim === currentTrim.name) {
      return;
    }
    setSelectedOptions((current) =>
      current.includes(option.id)
        ? current.filter((id) => id !== option.id)
        : [...current, option.id],
    );
  }

  const scenario = scenarios[selectedScenario];

  return (
    <main>
      <header className="site-header" aria-label="主导航">
        <a className="brand" href="#top" aria-label="周多福首页">
          <span className="brand-mark">周</span>
          <span>
            <strong>周多福</strong>
            <small>乐道购车顾问 | 家庭用车经验</small>
          </span>
        </a>
        <nav>
          {navItems.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">ONVO buyer guide</p>
          <h1>把乐道车型放回你的家庭生活里选择。</h1>
          <p className="hero-text">
            这里不是单纯抄配置表。我会把 L60、L80、L90 的价格、选装、空间和使用场景拆开，
            用通勤、带娃、父母同乘、长途旅行这些真实问题，帮你判断哪台车真正适合你。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#calculator">
              先算我的预算
            </a>
            <a className="secondary-action" href="#scenarios">
              按家庭场景看车
            </a>
          </div>
        </div>

        <div className="hero-panel" aria-label="乐道家庭用车视觉">
          <img src={models.l90.image} alt="乐道 L90 家庭旗舰 SUV" />
          <div className="signal-card">
            <span>我的判断标准</span>
            <strong>不急着成交，先把生活问题问对。</strong>
          </div>
        </div>
      </section>

      <section className="intro-band" aria-label="价值承诺">
        <p>
          购车咨询最有价值的地方，是把「我喜欢」翻译成「我长期会不会后悔」：
          价格、选装、补能、空间、家人感受和生活方式，都应该一起算。
        </p>
      </section>

      <section className="section model-section" id="models">
        <div className="section-heading">
          <p className="eyebrow">Current lineup</p>
          <h2>三台乐道，分别解决三类家庭用车问题</h2>
        </div>

        <div className="model-grid">
          {(Object.keys(models) as ModelKey[]).map((modelKey) => {
            const model = models[modelKey];
            const entryPrice = model.trims[0].vehiclePrice;
            const baasEntry = model.trims[0].baasPrice;

            return (
              <article className="model-card" key={model.name}>
                <img src={model.image} alt={`${model.name} 外观`} />
                <div className="model-card-body">
                  <span>{model.subtitle}</span>
                  <h3>{model.name}</h3>
                  <p>{model.headline}</p>
                  <div className="price-row">
                    <strong>{formatPrice(entryPrice)} 起</strong>
                    <small>BaaS {formatPrice(baasEntry)} 起</small>
                  </div>
                  <button type="button" onClick={() => chooseModel(modelKey)}>
                    放入计算器
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section calculator-section" id="calculator">
        <div className="calculator-copy">
          <p className="eyebrow">Price calculator</p>
          <h2>先把预算边界算清楚，再决定试驾哪一台</h2>
          <p>
            估算按 2026 年 7 月 21 日可查询到的乐道官网公开价格整理。
            已过期限时权益不计入总价；官网未披露单项价格的个性化配置，用自定义预算单独填写。
          </p>
        </div>

        <div className="calculator-shell">
          <div className="calculator-controls">
            <div className="control-group">
              <span className="control-label">车型</span>
              <div className="segmented">
                {(Object.keys(models) as ModelKey[]).map((modelKey) => (
                  <button
                    type="button"
                    className={selectedModel === modelKey ? "active" : ""}
                    key={modelKey}
                    onClick={() => chooseModel(modelKey)}
                  >
                    {models[modelKey].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">版本</span>
              <div className="trim-grid">
                {currentModel.trims.map((trim) => (
                  <button
                    type="button"
                    className={currentTrim.name === trim.name ? "trim-card active" : "trim-card"}
                    key={trim.name}
                    onClick={() => {
                      setSelectedTrim(trim.name);
                      setSelectedOptions([]);
                    }}
                  >
                    <span>{trim.tag}</span>
                    <strong>{trim.name}</strong>
                    <small>{trim.bestFor}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">购买方式</span>
              <div className="segmented">
                <button
                  type="button"
                  className={purchaseMode === "vehicle" ? "active" : ""}
                  onClick={() => setPurchaseMode("vehicle")}
                >
                  整车购买
                </button>
                <button
                  type="button"
                  className={purchaseMode === "baas" ? "active" : ""}
                  onClick={() => setPurchaseMode("baas")}
                >
                  BaaS 电池租用
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">选装配置</span>
              {visibleOptions.length > 0 ? (
                <div className="option-list">
                  {visibleOptions.map((option) => {
                    const disabled = option.excludedTrim === currentTrim.name;
                    const selected = selectedOptions.includes(option.id) && !disabled;
                    return (
                      <button
                        type="button"
                        className={selected ? "option-row active" : "option-row"}
                        key={option.id}
                        disabled={disabled}
                        onClick={() => toggleOption(option)}
                      >
                        <span>
                          <strong>{option.label}</strong>
                          <small>{disabled ? "当前版本已包含" : option.note}</small>
                        </span>
                        <b>{disabled ? "标配" : `+${formatPrice(option.price)}`}</b>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="muted-note">
                  官网未公开当前可选单项价格。可把颜色、轮圈、踏板、精品等预算填入下方自定义选装。
                </p>
              )}

              <label className="budget-input">
                <span>自定义选装预算</span>
                <input
                  min="0"
                  step="1000"
                  type="number"
                  value={customBudget}
                  onChange={(event) =>
                    setCustomBudget(Math.max(0, Number(event.target.value) || 0))
                  }
                />
              </label>
            </div>
          </div>

          <aside className="estimate-panel" aria-label="价格估算结果">
            <span className="estimate-kicker">{currentModel.name} {currentTrim.name}</span>
            <strong className="estimate-total">{formatPrice(estimateTotal)}</strong>
            <dl>
              <div>
                <dt>基础价格</dt>
                <dd>{formatPrice(basePrice)}</dd>
              </div>
              <div>
                <dt>已选官方选装</dt>
                <dd>{formatPrice(optionTotal)}</dd>
              </div>
              <div>
                <dt>自定义选装</dt>
                <dd>{formatPrice(customBudget)}</dd>
              </div>
            </dl>
            <p>
              {purchaseMode === "baas"
                ? "BaaS 会降低购车门槛，但需要结合电池租金、持有年限和换车计划再判断。"
                : "整车购买更适合希望一次性确认资产边界、长期持有和保值预期的人。"}
            </p>
            <a href={currentModel.officialUrl} target="_blank" rel="noreferrer">
              查看乐道官网口径
            </a>
          </aside>
        </div>
      </section>

      <section className="section scenario-section" id="scenarios">
        <div className="section-heading">
          <p className="eyebrow">Lifestyle match</p>
          <h2>按家庭和生活方式，而不是按参数表开始</h2>
        </div>

        <div className="scenario-layout">
          <div className="scenario-tabs" aria-label="选择用车场景">
            {(Object.keys(scenarios) as ScenarioKey[]).map((key) => (
              <button
                type="button"
                className={selectedScenario === key ? "active" : ""}
                key={key}
                onClick={() => {
                  setSelectedScenario(key);
                  chooseModel(scenarios[key].model);
                }}
              >
                {scenarios[key].label}
              </button>
            ))}
          </div>
          <article className="scenario-story">
            <span>推荐重点看 {models[scenario.model].name}</span>
            <h3>{scenario.title}</h3>
            <p>{scenario.story}</p>
            <ul>
              {scenario.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section highlights-section" id="highlights">
        <div className="highlights-lead">
          <p className="eyebrow">Model highlights</p>
          <h2>车型亮点要讲成家人能听懂的话</h2>
          <p>
            一台车好不好，不是销售顾问说得多漂亮，而是你过了三个月、三年之后，
            还觉得它每天都在帮你省事。
          </p>
        </div>

        <div className="highlight-grid">
          {(Object.keys(models) as ModelKey[]).map((modelKey) => (
            <article className="highlight-card" key={modelKey}>
              <span>{models[modelKey].name}</span>
              <h3>{models[modelKey].lifestyle}</h3>
              <ul>
                {models[modelKey].highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{models[modelKey].advisorNote}</p>
            </article>
          ))}
        </div>

        <div className="experience-grid">
          {experienceNotes.map((note) => (
            <article key={note.title}>
              <h3>{note.title}</h3>
              <p>{note.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section source-section" aria-label="资料来源">
        <div>
          <p className="eyebrow">Sources</p>
          <h2>价格和信息从官网来，判断从真实生活来</h2>
        </div>
        <ul>
          {(Object.keys(models) as ModelKey[]).map((modelKey) => (
            <li key={modelKey}>
              <a href={models[modelKey].officialUrl} target="_blank" rel="noreferrer">
                {models[modelKey].name}
              </a>
              <span>{models[modelKey].sourceLabel}</span>
            </li>
          ))}
          <li>
            <a href="https://www.onvo.cn/news" target="_blank" rel="noreferrer">
              乐道官网新闻
            </a>
            <span>用于核对上市与焕新价格、权益说明、车型定位。</span>
          </li>
        </ul>
      </section>

      <section className="contact-section" id="contact">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>想看车、试驾，或者把预算和家庭需求梳理一遍，可以从这里开始。</h2>
        </div>
        <a className="primary-action" href="mailto:hello@zhouduofu.com">
          发邮件给周多福
        </a>
      </section>
    </main>
  );
}
