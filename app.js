(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const els = {
    targetRole: $("targetRole"), resumeText: $("resumeText"), charHint: $("charHint"),
    dropZone: $("dropZone"), fileInput: $("fileInput"), analyzeBtn: $("analyzeBtn"),
    dropCopyStrong: $("dropCopyStrong"), dropCopySmall: $("dropCopySmall"),
    sampleBtn: $("sampleBtn"), clearBtn: $("clearBtn"), emptyState: $("emptyState"),
    report: $("report"), resultMeta: $("resultMeta"), scoreRing: $("scoreRing"),
    scoreNumber: $("scoreNumber"), toneBadge: $("toneBadge"), summaryTitle: $("summaryTitle"),
    summaryText: $("summaryText"), summaryStats: $("summaryStats"), dimensionGrid: $("dimensionGrid"),
    strengthCount: $("strengthCount"), weaknessCount: $("weaknessCount"),
    strengthList: $("strengthList"), weaknessList: $("weaknessList"),
    copyBtn: $("copyBtn"), downloadBtn: $("downloadBtn"), toast: $("toast")
  };

  let lastReport = null;
  let toastTimer = null;

  const roleMap = [
    { match: /前端|web|javascript/i, words: ["JavaScript", "TypeScript", "React", "Vue", "HTML", "CSS", "Webpack", "Vite", "性能优化", "组件化"] },
    { match: /后端|服务端|java|golang|go开发|node/i, words: ["Java", "Spring", "Golang", "Node.js", "MySQL", "Redis", "Kafka", "Docker", "微服务", "高并发", "Linux"] },
    { match: /算法|机器学习|人工智能|ai工程|深度学习|大模型/i, words: ["Python", "PyTorch", "TensorFlow", "SQL", "机器学习", "深度学习", "NLP", "CV", "模型", "A/B测试"] },
    { match: /数据分析|商业分析|bi分析|数据科学/i, words: ["SQL", "Excel", "Python", "Tableau", "Power BI", "统计分析", "数据可视化", "A/B测试", "指标体系"] },
    { match: /产品经理|产品岗|产品助理/i, words: ["需求分析", "用户研究", "PRD", "数据分析", "项目管理", "原型", "Axure", "Figma", "留存", "转化"] },
    { match: /运营|用户增长|内容运营|活动运营/i, words: ["用户增长", "内容运营", "活动运营", "数据复盘", "转化率", "留存", "ROI", "社群", "渠道"] },
    { match: /设计|ui|ux|交互设计|视觉设计/i, words: ["Figma", "Sketch", "Photoshop", "交互设计", "视觉设计", "用户研究", "设计规范", "原型", "可用性"] },
    { match: /销售|商务拓展|bd|客户经理/i, words: ["客户开发", "商机", "CRM", "成交", "销售漏斗", "回款", "续约", "客单价", "渠道"] },
    { match: /人力资源|hr|招聘|hrbp/i, words: ["招聘", "绩效", "薪酬", "员工关系", "组织发展", "HRBP", "人才盘点", "培训"] },
    { match: /财务|会计|审计|税务/i, words: ["财务分析", "报表", "预算", "Excel", "税务", "审计", "成本核算", "资金管理"] },
    { match: /项目经理|项目管理|实施顾问/i, words: ["项目管理", "需求梳理", "里程碑", "风险控制", "跨部门协作", "交付", "敏捷", "PMP"] }
  ];

  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js", "Java", "Spring", "Python", "Golang", "C++", "C#",
    "SQL", "MySQL", "PostgreSQL", "Redis", "MongoDB", "Kafka", "Docker", "Kubernetes", "Linux", "Git", "Webpack", "Vite",
    "PyTorch", "TensorFlow", "Excel", "Tableau", "Power BI", "Figma", "Sketch", "Axure", "Photoshop", "PRD", "CRM", "PMP",
    "数据分析", "机器学习", "深度学习", "微服务", "项目管理", "用户研究", "A/B测试"
  ];

  const actionWords = [
    "主导", "牵头", "负责", "推动", "搭建", "设计", "开发", "优化", "重构", "上线", "交付", "组织", "协调", "分析",
    "制定", "落地", "管理", "策划", "增长", "降低", "提升", "缩短", "节约", "达成", "拓展", "维护", "培训", "审计",
    "led", "managed", "built", "designed", "developed", "optimized", "launched", "delivered", "improved", "increased", "reduced"
  ];

  const resultWords = [
    "提升", "降低", "增长", "节约", "缩短", "达成", "超额", "增长至", "转化率", "留存", "复购", "营收", "收入", "利润",
    "GMV", "ROI", "DAU", "MAU", "效率", "准确率", "成功率", "覆盖率", "成本", "耗时", "排名", "获奖", "通过率",
    "improved", "increased", "reduced", "grew", "saved", "achieved", "conversion"
  ];

  const genericPhrases = [
    "认真负责", "吃苦耐劳", "有责任心", "责任心强", "团队合作", "团队精神", "沟通能力强", "善于沟通", "学习能力强",
    "抗压能力强", "积极主动", "勤奋踏实", "熟练掌握办公软件", "熟练使用office", "良好的沟通能力", "较强的学习能力"
  ];
  const vagueWords = ["大量", "多个", "若干", "显著", "极大", "有效提升", "有效改善", "丰富经验", "相关经验", "各种", "等等"];
  const sensitivePatterns = [
    { re: /性别\s*[:：]?/, label: "性别" }, { re: /年龄\s*[:：]?/, label: "年龄" },
    { re: /婚育|婚姻状况|已婚|未婚/, label: "婚育状况" }, { re: /身份证|身份证号/, label: "身份证号" },
    { re: /籍贯\s*[:：]?/, label: "籍贯" }, { re: /身高|体重/, label: "身高体重" },
    { re: /民族\s*[:：]?/, label: "民族" }, { re: /政治面貌\s*[:：]?/, label: "政治面貌" }
  ];

  const sectionDefs = [
    { id: "summary", label: "个人简介", re: /(个人简介|个人总结|自我评价|求职意向|职业概述|summary|profile|objective)/i },
    { id: "experience", label: "工作或实习经历", re: /(工作经历|工作经验|实习经历|职业经历|任职经历|experience|employment)/i },
    { id: "projects", label: "项目经历", re: /(项目经历|项目经验|代表项目|作品集|项目名称|projects?|portfolio)/i },
    { id: "education", label: "教育经历", re: /(教育经历|教育背景|学习经历|学校|大学|学院|学历|学位|GPA|education)/i },
    { id: "skills", label: "技能或证书", re: /(专业技能|技能清单|技术栈|核心技能|证书|语言能力|资格证|skills?|certificates?)/i }
  ];

  const sampleResume = `张明
求职意向：后端开发工程师
电话：138-0000-0000 | 邮箱：zhangming@example.com | GitHub：github.com/example

个人简介
3 年 Java 后端开发经验，关注高并发服务与稳定性建设，具备从需求分析到上线交付的完整项目经验。

工作经历
2022.07 - 至今  某互联网科技有限公司  后端开发工程师
• 主导订单查询服务重构，引入 Redis 多级缓存并优化慢 SQL，接口 P95 耗时从 820ms 降至 210ms。
• 搭建订单对账任务平台，覆盖日均 120 万笔交易，将对账失败排查时间从 4 小时缩短至 30 分钟。
• 推动核心服务容器化与自动化发布，发布频率提升 60%，线上回滚耗时降低 70%。

项目经历
2023.03 - 2023.10  用户增长数据服务
• 负责事件采集网关与指标聚合服务，使用 Kafka、MySQL、Redis，支撑日均 3000 万条行为事件。
• 设计灰度发布与降级方案，服务可用性保持在 99.95%。

教育经历
2018.09 - 2022.06  某大学  软件工程  本科
• GPA 3.7/4.0；获得校级一等奖学金。

专业技能
Java、Spring Boot、MySQL、Redis、Kafka、Docker、Linux、Git；熟悉微服务架构与性能优化。`;

  function normalize(text) {
    return String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
  }
  function escapeHTML(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function unique(items) { return [...new Set(items.filter(Boolean))]; }
  function clamp(value, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(value))); }
  function countText(text) {
    const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
    const latin = (text.match(/[A-Za-z0-9]+/g) || []).length;
    const compact = text.replace(/\s/g, "").length;
    return { cjk, latin, compact, readingMinutes: Math.max(1, Math.ceil(cjk / 420 + latin / 220)) };
  }
  function linesOf(text) { return text.split("\n").map((line) => line.trim()).filter(Boolean); }
  function isBullet(line) { return /^([•·▪◦●○\-–—*]|\d+[.、)]|[（(]\d+[)）])/.test(line); }
  function findMatches(text, terms) {
    const lower = text.toLowerCase();
    return terms.filter((term) => lower.includes(term.toLowerCase()));
  }

  function collectSignals(text, targetRole) {
    const lines = linesOf(text);
    const count = countText(text);
    const hasEmail = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text);
    const phoneDigits = text.replace(/[^\d+]/g, ""); const hasPhone = /(?:\+?86)?1[3-9]\d{9}/.test(phoneDigits) || /0\d{2,3}[- ]?\d{7,8}/.test(text);
    const hasLink = /(github|linkedin|gitee|gitlab|个人网站|作品集|https?:\/\/)/i.test(text);
    const sections = sectionDefs.filter((section) => section.re.test(text));
    const bulletLines = lines.filter(isBullet);
    const detailLines = lines.filter((line) => !sectionDefs.some((section) => section.re.test(line)) && line.length >= 6);
    const numberedLines = lines.filter((line) => (line.match(/\d/g) || []).length > 0);
    const quantifiedLines = detailLines.filter((line) => /(?:\d+(?:\.\d+)?\s*(?:%|％|万|亿|元|美元|人|天|小时|分钟|ms|秒|条|次|个|家|笔|倍))|(?:¥|￥|\$)\s*\d+/i.test(line));
    const outcomeLines = detailLines.filter((line) => findMatches(line, resultWords).length > 0);
    const actionMatches = findMatches(text, actionWords);
    const resultMatches = findMatches(text, resultWords);
    const genericMatches = findMatches(text, genericPhrases);
    const vagueMatches = findMatches(text, vagueWords);
    const sensitiveMatches = sensitivePatterns.filter((item) => item.re.test(text)).map((item) => item.label);
    const dateMatches = text.match(/(?:19|20)\d{2}\s*(?:[.\-/年]\s*\d{1,2})?/g) || [];
    const skillMatches = findMatches(text, commonSkills);
    const longLines = detailLines.filter((line) => line.length > 115);
    const sentenceParts = text.split(/[。；;！？!?]/).map((item) => item.trim()).filter(Boolean);
    const repeatedPunctuation = (text.match(/([，,。；;！!？?])\1{1,}/g) || []).length;
    const firstPersonCount = (text.match(/(?:^|[\n。；;，,])\s*我(?:\S{0,6})/g) || []).length;
    const sectionLabels = sections.map((section) => section.label);

    let expectedKeywords = [];
    const target = targetRole.trim();
    if (target) {
      const mapped = roleMap.filter((item) => item.match.test(target)).flatMap((item) => item.words);
      const fragments = target.split(/[\s,，、/|]+/).filter((item) => item.length >= 2);
      expectedKeywords = unique([...mapped, ...fragments]).slice(0, 16);
    }
    const keywordHits = target ? findMatches(text, expectedKeywords) : [];
    const missingKeywords = target ? expectedKeywords.filter((word) => !keywordHits.includes(word)) : [];
    const keywordCoverage = expectedKeywords.length ? keywordHits.length / expectedKeywords.length : null;

    return {
      text, lines, count, target, hasEmail, hasPhone, hasLink, sections, sectionLabels,
      bulletLines, detailLines, numberedLines, quantifiedLines, outcomeLines,
      actionMatches, resultMatches, genericMatches, vagueMatches, sensitiveMatches,
      dateMatches: unique(dateMatches), skillMatches, longLines, sentenceParts,
      repeatedPunctuation, firstPersonCount, expectedKeywords, keywordHits, missingKeywords, keywordCoverage,
      bulletRatio: detailLines.length ? bulletLines.length / detailLines.length : 0,
      quantifiedRatio: detailLines.length ? quantifiedLines.length / detailLines.length : 0,
      outcomeRatio: detailLines.length ? outcomeLines.length / detailLines.length : 0
    };
  }

  function makeDimensions(s) {
    const sectionPoints = s.sections.length * 12;
    const contactPoints = (s.hasEmail ? 8 : 0) + (s.hasPhone ? 8 : 0) + (s.hasLink ? 4 : 0);
    const completeness = clamp(18 + sectionPoints + contactPoints);

    let achievement = 24;
    achievement += Math.min(38, s.quantifiedRatio * 92);
    achievement += Math.min(18, s.quantifiedLines.length * 3);
    achievement += Math.min(12, s.resultMatches.length * 2);
    achievement += Math.min(10, s.actionMatches.length * 1.4);
    achievement -= Math.min(14, s.vagueMatches.length * 3);
    achievement -= Math.min(15, s.genericMatches.length * 3);

    let clarity = 52;
    clarity += Math.min(23, s.bulletRatio * 38);
    clarity += Math.min(14, s.sections.length * 3);
    clarity -= Math.min(21, s.longLines.length * 5);
    clarity -= Math.min(16, s.repeatedPunctuation * 5);
    clarity -= Math.min(10, s.firstPersonCount * 2);
    if (s.lines.length < 7) clarity -= 12;

    let relevance = 42;
    if (s.skillMatches.length) relevance += Math.min(23, s.skillMatches.length * 2.2);
    if (s.sections.some((item) => item.id === "skills")) relevance += 12;
    if (s.dateMatches.length >= 3) relevance += 10;
    if (s.keywordCoverage !== null) {
      relevance = 32 + s.keywordCoverage * 58;
      if (s.sections.some((item) => item.id === "skills")) relevance += 6;
    } else if (s.target) relevance += 8;

    let conciseness = 78;
    if (s.count.compact < 280) conciseness -= 28;
    if (s.count.compact < 130) conciseness -= 22;
    if (s.count.compact > 2400) conciseness -= 14;
    if (s.count.compact > 3600) conciseness -= 22;
    conciseness -= Math.min(22, s.genericMatches.length * 5);
    conciseness -= Math.min(15, s.vagueMatches.length * 3);
    if (s.bulletRatio >= 0.42 && s.longLines.length <= 1) conciseness += 8;
    if (s.sensitiveMatches.length) conciseness -= Math.min(10, s.sensitiveMatches.length * 3);

    const dimensions = [
      { key: "completeness", label: "信息完整度", score: completeness },
      { key: "achievement", label: "成果量化", score: clamp(achievement) },
      { key: "clarity", label: "表达清晰度", score: clamp(clarity) },
      { key: "relevance", label: "岗位相关性", score: clamp(relevance) },
      { key: "conciseness", label: "内容精简度", score: clamp(conciseness) }
    ];
    const overall = clamp(
      completeness * 0.2 + clamp(achievement) * 0.25 + clamp(clarity) * 0.2 +
      clamp(relevance) * 0.2 + clamp(conciseness) * 0.15
    );
    return { dimensions, overall };
  }

  function buildStrengths(s) {
    const items = [];
    if (s.hasEmail && s.hasPhone) items.push({ title: "联系方式完整，基本信息可快速核实", detail: "姓名之外，邮箱与电话都已出现，招聘方不需要额外查找联系渠道。", weight: 72 });
    if (s.sections.length >= 4) {
      items.push({ title: "简历结构清楚，常见模块较完整", detail: `已识别到 ${s.sectionLabels.join("、")} 等 ${s.sections.length} 个模块，信息分区明确，便于快速定位。`, weight: 78 });
    } else if (s.sections.length >= 3) {
      items.push({ title: "主干模块已经建立", detail: `已识别到 ${s.sectionLabels.join("、")}，阅读路径基本清楚。`, weight: 62 });
    }
    if (s.quantifiedLines.length >= 3 || s.quantifiedRatio >= 0.32) {
      items.push({ title: "成果有数据支撑，可信度较高", detail: `共有 ${s.quantifiedLines.length} 条描述包含数字、比例或金额，能把工作结果落到可比较的尺度上。`, weight: 92 });
    } else if (s.quantifiedLines.length >= 1) {
      items.push({ title: "部分经历已使用量化表达", detail: `至少有 ${s.quantifiedLines.length} 条描述含有可验证的数据，比纯职责描述更有说服力。`, weight: 58 });
    }
    if (s.resultMatches.length >= 3 || s.outcomeRatio >= 0.24) {
      items.push({ title: "体现了结果导向", detail: `出现“${s.resultMatches.slice(0, 4).join("、")}”等结果词，能看出行动带来的变化，而非只列职责。`, weight: 86 });
    }
    if (s.bulletLines.length >= 5 && s.longLines.length <= 2) {
      items.push({ title: "经历采用条目化表达，便于扫读", detail: `识别到 ${s.bulletLines.length} 条项目符号描述，且长句控制较好，招聘方可以快速抓取重点。`, weight: 76 });
    }
    if (s.skillMatches.length >= 7) {
      items.push({ title: "技能信息具体且有辨识度", detail: `能找到 ${s.skillMatches.slice(0, 7).join("、")} 等具体技能，技术或专业能力不是泛泛而谈。`, weight: 80 });
    }
    if (s.count.compact >= 420 && s.count.compact <= 1800) {
      items.push({ title: "篇幅适中，信息密度较合理", detail: `有效字符约 ${s.count.compact}，预计 ${s.count.readingMinutes} 分钟读完；没有明显过长或过短的问题。`, weight: 65 });
    }
    if (s.keywordCoverage !== null && s.keywordCoverage >= 0.55) {
      items.push({ title: "与目标岗位有一定关键词交集", detail: `已命中 ${s.keywordHits.slice(0, 7).join("、") || "部分岗位词"}，相关经历更容易被快速识别。`, weight: 90 });
    }
    if (s.dateMatches.length >= 3 && s.count.compact >= 300) {
      items.push({ title: "时间信息较清晰", detail: `识别到 ${s.dateMatches.length} 处年份或月期信息，经历顺序与时间线具有基本可读性。`, weight: 63 });
    }
    if (s.genericMatches.length === 0 && s.vagueMatches.length <= 1 && s.count.compact >= 350) {
      items.push({ title: "少用空泛套话，表达相对务实", detail: "没有大量出现“认真负责”“学习能力强”或“多个、若干”等无法验证的泛化表达。", weight: 70 });
    }
    if (!items.length) items.push({ title: "文本已经具备基本可读性", detail: "虽然可用证据较少，但当前内容仍能形成一份可继续修改的简历初稿。", weight: 40 });
    return unique(items.map((item) => item.title)).map((title) => items.find((item) => item.title === title))
      .sort((a, b) => b.weight - a.weight).slice(0, 6);
  }

  function buildWeaknesses(s) {
    const items = [];
    if (s.count.compact < 80) {
      return [{ title: "内容过短，无法形成可靠评估", detail: `目前只有约 ${s.count.compact} 个有效字符，缺少足够经历与成果信息。请至少补充教育、工作或项目经历后再评估。`, priority: "高", weight: 999 }];
    }
    if (!s.hasPhone || !s.hasEmail) {
      const missing = [!s.hasPhone ? "电话" : "", !s.hasEmail ? "邮箱" : ""].filter(Boolean).join("和");
      items.push({ title: "基础联系方式不完整", detail: `未识别到${missing}，招聘方可能需要额外寻找联系渠道，会增加沟通成本。`, priority: "高", weight: 98 });
    }
    if (!s.sections.some((item) => item.id === "experience") && !s.sections.some((item) => item.id === "projects")) {
      items.push({ title: "缺少工作、实习或项目经历模块", detail: "招聘方最关心的通常是“做过什么、做成什么”。当前没有识别到对应模块，会显著削弱简历的可判断性。", priority: "高", weight: 96 });
    }
    if (s.quantifiedLines.length < 2 || s.quantifiedRatio < 0.18) {
      items.push({ title: "成果缺少数字与可验证结果", detail: `识别到 ${s.quantifiedLines.length} 条量化描述。建议为关键经历补充规模、效率、收入、转化率、耗时或质量指标，让“做得好”变成可比较的事实。`, priority: "高", weight: 94 });
    }
    if (s.keywordCoverage !== null && s.keywordCoverage < 0.5) {
      items.push({ title: "与目标岗位的关键词覆盖偏低", detail: `目标岗位词命中率约 ${Math.round(s.keywordCoverage * 100)}%。${s.missingKeywords.length ? `“${s.missingKeywords.slice(0, 5).join("、")}”等能力尚未获得文字证据。` : "技能或经历与岗位的直接关联还不够明显。"}`, priority: "高", weight: 92 });
    } else if (!s.target && s.skillMatches.length < 4) {
      items.push({ title: "专业能力证据不够集中", detail: "识别的具体技能较少。若申请明确岗位，可补充与岗位直接相关的工具、方法或技术，并说明使用场景。", priority: "中", weight: 72 });
    }
    if (!s.sections.some((item) => item.id === "skills") && s.skillMatches.length < 7) {
      items.push({ title: "缺少独立、清晰的技能模块", detail: "技能可能散落在经历描述中。单独归纳核心技能，有助于招聘方在几秒内确认岗位匹配度。", priority: "中", weight: 80 });
    }
    if (s.longLines.length >= 2 || s.sentenceParts.some((line) => line.length > 150)) {
      items.push({ title: "存在过长描述，重点不够突出", detail: `识别到 ${s.longLines.length} 条超过 115 字的长描述。长句会掩盖行动、方法和结果，应拆成更短的信息点。`, priority: "中", weight: 82 });
    }
    if (s.bulletRatio < 0.22 && s.detailLines.length >= 7) {
      items.push({ title: "经历段落缺少清晰的条目结构", detail: `条目化描述占比约 ${Math.round(s.bulletRatio * 100)}%。大段连续文字会增加扫读难度，也容易让关键成果被淹没。`, priority: "中", weight: 80 });
    }
    if (s.genericMatches.length >= 2) {
      items.push({ title: "空泛自评或套话偏多", detail: `出现“${s.genericMatches.slice(0, 5).join("、")}”等表述。这些词每个人都能写，无法形成差异，应换成具体行为或结果。`, priority: "中", weight: 78 });
    }
    if (s.vagueMatches.length >= 2) {
      items.push({ title: "部分表达不具体，缺少边界", detail: `含“${s.vagueMatches.slice(0, 5).join("、")}”等模糊词。无法判断规模、频率或实际产出，可信度会下降。`, priority: "中", weight: 76 });
    }
    if (s.count.compact < 350) {
      items.push({ title: "内容量偏少，经历显得单薄", detail: `有效字符约 ${s.count.compact}。如果是应届生，可通过课程项目、实习、竞赛或校园实践补充；职场人则应补足职责范围与成果。`, priority: "中", weight: 74 });
    }
    if (s.count.compact > 2600) {
      items.push({ title: "篇幅偏长，核心信息被稀释", detail: `有效字符约 ${s.count.compact}，对多数岗位已超过常规一至两页的信息量。应优先保留与目标岗位强相关的内容。`, priority: "中", weight: 72 });
    }
    if (s.dateMatches.length < 2) {
      items.push({ title: "时间线信息不足", detail: "识别的起止时间较少，招聘方难以判断经历顺序、持续时长与空档期。每段教育和经历都建议写明起止年月。", priority: "中", weight: 70 });
    }
    if (s.repeatedPunctuation > 0 || s.firstPersonCount >= 3) {
      items.push({ title: "存在口语化或不规范的书面表达", detail: `${s.repeatedPunctuation > 0 ? "检测到重复标点。" : ""}${s.firstPersonCount >= 3 ? "多次出现‘我’开头，简历通常可省略主语并直接写行动。" : ""}`, priority: "低", weight: 56 });
    }
    if (s.sensitiveMatches.length) {
      items.push({ title: "包含较多与岗位无关的个人信息", detail: `识别到${s.sensitiveMatches.slice(0, 5).join("、")}等信息。除非应聘地区或岗位明确要求，否则会增加无效信息并带来隐私风险。`, priority: "低", weight: 54 });
    }
    if (s.actionMatches.length < 5) {
      items.push({ title: "行动动词不够丰富，职责感偏强", detail: "各条经历如果都以“负责”“参与”开头，会显得责任边界和贡献度不清。应明确个人动作与主导程度。", priority: "低", weight: 60 });
    }
    if (!items.length) items.push({ title: "未发现明显的结构性问题", detail: "从当前文本看，未触发重大短板规则。仍建议针对具体岗位人工复核关键词与成果真实性。", priority: "低", weight: 20 });
    return unique(items.map((item) => item.title)).map((title) => items.find((item) => item.title === title))
      .sort((a, b) => b.weight - a.weight).slice(0, 6);
  }

  function toneFor(score) {
    if (score >= 85) return { label: "很有竞争力", title: "整体扎实，已经是一份可主动投递的简历", text: "结构、成果和表达都比较完整；下一步重点是针对不同岗位微调相关经历，而不是大改。" };
    if (score >= 72) return { label: "基础良好", title: "整体可用，但还有几处影响说服力的短板", text: "简历框架和基本表达成立，优先补齐量化结果与岗位关键词，整体质感会明显提升。" };
    if (score >= 60) return { label: "基本合格", title: "信息有了，但亮点还没有被充分呈现", text: "招聘方能看到经历轮廓，却不容易快速判断贡献与匹配度。建议先处理高优先级缺点。" };
    return { label: "需要完善", title: "当前更像经历记录，还不足以支撑有竞争力的投递", text: "关键成果、结构或岗位相关性存在明显缺口，应先补事实与证据，再考虑版式优化。" };
  }

  function renderFinding(item, type) {
    const priority = type === "weakness" && item.priority ? `<span class="priority">${escapeHTML(item.priority)}优先</span>` : "";
    return `<li class="finding-item ${type}-item"><h5><span>${escapeHTML(item.title)}${priority}</span></h5><p>${escapeHTML(item.detail)}</p></li>`;
  }

  function evaluate() {
    const text = normalize(els.resumeText.value);
    const target = els.targetRole.value.trim();
    const compactLength = text.replace(/\s/g, "").length;
    if (compactLength < 20) {
      showToast("请先粘贴至少 20 个字符的简历内容");
      els.resumeText.focus();
      return;
    }
    const signals = collectSignals(text, target);
    const { dimensions, overall } = makeDimensions(signals);
    const strengths = buildStrengths(signals);
    const weaknesses = buildWeaknesses(signals);
    const tone = toneFor(overall);

    lastReport = {
      created: new Date().toLocaleString("zh-CN"), overall, tone: tone.label, dimensions, strengths, weaknesses,
      stats: { compact: signals.count.compact, sections: signals.sections.length, quantified: signals.quantifiedLines.length, bullets: signals.bulletLines.length, readingMinutes: signals.count.readingMinutes },
      target
    };

    els.emptyState.hidden = true;
    els.report.hidden = false;
    els.resultMeta.textContent = `${target ? `目标岗位：${target} · ` : ""}${signals.count.compact} 个有效字符 · 规则诊断`;
    els.scoreNumber.textContent = overall;
    els.scoreRing.style.setProperty("--score", overall);
    els.scoreRing.setAttribute("aria-label", `综合得分 ${overall} 分`);
    els.toneBadge.textContent = tone.label;
    els.summaryTitle.textContent = tone.title;
    els.summaryText.textContent = tone.text;
    els.summaryStats.innerHTML = [
      `${signals.count.readingMinutes} 分钟读完`, `${signals.sections.length} 个模块`,
      `${signals.quantifiedLines.length} 条量化描述`, `${signals.bulletLines.length} 条条目`
    ].map((item) => `<span class="stat-chip">${escapeHTML(item)}</span>`).join("");
    els.dimensionGrid.innerHTML = dimensions.map((item) => `
      <div class="dimension"><div class="dimension-top"><span>${escapeHTML(item.label)}</span><b>${item.score}</b></div>
      <div class="bar"><i style="width:${item.score}%"></i></div></div>`).join("");
    els.strengthList.innerHTML = strengths.map((item) => renderFinding(item, "strength")).join("");
    els.weaknessList.innerHTML = weaknesses.map((item) => renderFinding(item, "weakness")).join("");
    els.strengthCount.textContent = strengths.length;
    els.weaknessCount.textContent = weaknesses.length;
    if (window.innerWidth <= 1050) els.report.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reportAsText() {
    if (!lastReport) return "";
    return [
      "简历优缺点评估报告", `生成时间：${lastReport.created}`,
      lastReport.target ? `目标岗位：${lastReport.target}` : "目标岗位：未填写",
      `综合得分：${lastReport.overall}/100（${lastReport.tone}）`, "", "五项诊断",
      ...lastReport.dimensions.map((item) => `- ${item.label}：${item.score}/100`), "",
      `优点（${lastReport.strengths.length}）`,
      ...lastReport.strengths.map((item, index) => `${index + 1}. ${item.title}\n   ${item.detail}`), "",
      `缺点（${lastReport.weaknesses.length}）`,
      ...lastReport.weaknesses.map((item, index) => `${index + 1}. [${item.priority || "提示"}] ${item.title}\n   ${item.detail}`), "",
      "说明：本报告仅基于简历文本进行规则评估，不替代招聘方的人工判断。"
    ].join("\n");
  }

  async function copyReport() {
    const content = reportAsText();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      showToast("评估结论已复制");
    } catch {
      const area = document.createElement("textarea");
      area.value = content; area.style.position = "fixed"; area.style.opacity = "0";
      document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
      showToast("评估结论已复制");
    }
  }

  function downloadReport() {
    const content = reportAsText();
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `简历优缺点评估_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast("报告已下载");
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function setDropState(message, state = "idle") {
    els.dropZone.classList.toggle("busy", state === "busy");
    els.dropZone.classList.toggle("error", state === "error");
    els.dropZone.setAttribute("aria-busy", state === "busy" ? "true" : "false");
    els.dropCopyStrong.textContent = message || "拖入 PDF、Word 或文本文件";
    els.dropCopySmall.textContent = state === "idle"
      ? "支持 .pdf / .docx / .txt / .md / .csv，文件不会上传"
      : (state === "error" ? "请检查文件格式后重试" : "正在本机解析，请稍候");
  }

  async function extractPdfText(file) {
    if (!window.pdfjsLib) throw new Error("PDF 解析组件未加载，请刷新页面后重试");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("vendor/pdf.worker.min.js", window.location.href).href;
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    const pages = [];
    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        setDropState(`正在解析 PDF：第 ${pageNumber} / ${pdf.numPages} 页`);
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const lines = [];
        let currentLine = "";
        let lastY = null;

        for (const item of content.items) {
          const value = String(item.str || "");
          if (!value.trim()) continue;
          const y = item.transform ? Math.round(item.transform[5]) : null;
          if (lastY !== null && y !== null && Math.abs(y - lastY) > 2 && currentLine.trim()) {
            lines.push(currentLine.trim());
            currentLine = "";
          }
          currentLine += value;
          if (item.hasEOL) {
            lines.push(currentLine.trim());
            currentLine = "";
            lastY = null;
          } else {
            currentLine += " ";
            lastY = y;
          }
        }
        if (currentLine.trim()) lines.push(currentLine.trim());
        pages.push(lines.filter(Boolean).join("\n"));
      }
    } finally {
      await pdf.destroy();
    }
    return { text: pages.join("\n\n"), pages: pdf.numPages };
  }

  async function extractDocxText(file) {
    if (!window.mammoth) throw new Error("Word 解析组件未加载，请刷新页面后重试");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: result.value || "", pages: null };
  }

  async function readFile(file) {
    if (!file) return;
    const extension = (file.name.split(".").pop() || "").toLowerCase();
    const isPdf = extension === "pdf" || file.type === "application/pdf";
    const isDocx = extension === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isLegacyDoc = extension === "doc" || file.type === "application/msword";
    const isText = ["txt", "md", "csv"].includes(extension) || file.type.startsWith("text/");

    if (file.size > 25 * 1024 * 1024) {
      setDropState("文件超过 25 MB，请压缩后再导入", "error");
      showToast("文档过大，请控制在 25 MB 以内");
      setTimeout(() => setDropState(""), 3500);
      return;
    }
    if (isLegacyDoc) {
      setDropState("旧版 .doc 暂不支持，请另存为 .docx 或 PDF", "error");
      showToast("请在 Word 中把 .doc 另存为 .docx 或 PDF");
      setTimeout(() => setDropState(""), 4500);
      return;
    }
    if (!isPdf && !isDocx && !isText) {
      setDropState("不支持该格式，请选择 PDF、DOCX、TXT 等文件", "error");
      showToast("当前支持 PDF、DOCX、TXT、MD 和 CSV");
      setTimeout(() => setDropState(""), 4000);
      return;
    }

    try {
      let parsed;
      if (isPdf) {
        setDropState("正在读取 PDF 并提取文字…");
        parsed = await extractPdfText(file);
      } else if (isDocx) {
        setDropState("正在读取 Word 文档并提取文字…");
        parsed = await extractDocxText(file);
      } else {
        setDropState("正在读取文本文件…");
        parsed = { text: await file.text(), pages: null };
      }

      const extracted = normalize(parsed.text);
      if (extracted.replace(/\s/g, "").length < 30) {
        throw new Error(isPdf
          ? "PDF 中未提取到足够文字，扫描版图片需要使用 OCR 后再导入"
          : "文档中未提取到足够文字，请检查文件是否为空或已损坏");
      }

      els.resumeText.value = extracted.slice(0, 120000);
      updateCount();
      const pageText = parsed.pages ? `，共 ${parsed.pages} 页` : "";
      showToast(`已导入 ${file.name}${pageText}`);
    } catch (error) {
      const message = /password/i.test(error.message || "")
        ? "PDF 已加密，请先解除密码后重试"
        : (error.message || "文件解析失败，请换一个文件重试");
      setDropState(message, "error");
      showToast(message);
      setTimeout(() => setDropState(""), 4500);
    } finally {
      if (!els.dropZone.classList.contains("error")) setDropState("");
    }
  }
  function updateCount() {
    els.charHint.textContent = `${els.resumeText.value.replace(/\s/g, "").length} 字`;
  }

  els.analyzeBtn.addEventListener("click", evaluate);
  els.sampleBtn.addEventListener("click", () => {
    els.targetRole.value = "后端开发工程师";
    els.resumeText.value = sampleResume;
    updateCount();
    showToast("示例已填入，可直接评估");
  });
  els.clearBtn.addEventListener("click", () => {
    els.targetRole.value = ""; els.resumeText.value = ""; lastReport = null;
    els.report.hidden = true; els.emptyState.hidden = false;
    els.scoreRing.style.setProperty("--score", 0); updateCount(); els.resumeText.focus();
  });
  els.copyBtn.addEventListener("click", copyReport);
  els.downloadBtn.addEventListener("click", downloadReport);
  els.resumeText.addEventListener("input", updateCount);
  els.resumeText.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); evaluate(); }
  });
  els.dropZone.addEventListener("click", () => { if (!els.dropZone.classList.contains("busy")) els.fileInput.click(); });
  els.dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); els.fileInput.click(); }
  });
  els.fileInput.addEventListener("change", (event) => { const file = event.target.files[0]; readFile(file).finally(() => { event.target.value = ""; }); });
  ["dragenter", "dragover"].forEach((name) => els.dropZone.addEventListener(name, (event) => {
    event.preventDefault(); els.dropZone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((name) => els.dropZone.addEventListener(name, (event) => {
    event.preventDefault(); els.dropZone.classList.remove("dragging");
  }));
  els.dropZone.addEventListener("drop", (event) => readFile(event.dataTransfer.files[0]));
  const query = new URLSearchParams(window.location.search);
  if (query.get("demo") === "1") {
    els.targetRole.value = "后端开发工程师";
    els.resumeText.value = sampleResume;
    updateCount();
    evaluate();
  }
  window.__resumeImporter = Object.freeze({ readFile });
  updateCount();
})();