/**
 * NewsHub CMS — 种子数据脚本
 *
 * 功能：
 * 1. 创建管理员账号（邮箱密码登录用）
 * 2. 填充示例分类
 * 3. 填充示例新闻
 *
 * 运行：node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 读取 .env.local
const envRaw = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const envVars = {};
envRaw.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = envVars.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 请确保 .env.local 中包含 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ──────────────────────────────────────────────
// Supabase 客户端（service_role 模式，绕过 RLS）
// ──────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ──────── 配色方案 ────────
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';

// ──────────────────────────────────────────────
// 配置区 - 可以修改
// ──────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@newshub.com';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_DISPLAY_NAME = '管理员';

// ──────────────────────────────────────────────
// 种子数据
// ──────────────────────────────────────────────

const CATEGORIES = [
  { name: '科技', slug: 'tech', description: '科技前沿与互联网动态', sort_order: 1 },
  { name: '人工智能', slug: 'ai', description: 'AI 与机器学习最新进展', parent_slug: 'tech', sort_order: 1 },
  { name: '智能手机', slug: 'smartphone', description: '手机评测与行业资讯', parent_slug: 'tech', sort_order: 2 },
  { name: '体育', slug: 'sports', description: '国内外体育赛事资讯', sort_order: 2 },
  { name: '足球', slug: 'football', description: '足球赛事与转会动态', parent_slug: 'sports', sort_order: 1 },
  { name: '篮球', slug: 'basketball', description: 'NBA 与 CBA 资讯', parent_slug: 'sports', sort_order: 2 },
  { name: '财经', slug: 'finance', description: '经济金融与投资理财', sort_order: 3 },
  { name: '健康', slug: 'health', description: '医疗健康与养生知识', sort_order: 4 },
  { name: '教育', slug: 'education', description: '教育政策与学习资源', sort_order: 5 },
];

// 每篇文章的封面图（picsum.photos 根据 seed 返回固定图片）
const ARTICLE_IMAGES = {
  'ai-trends-2026': 'https://picsum.photos/seed/ai2026/1200/630',
  'flagship-phone-review-2026': 'https://picsum.photos/seed/phone2026/1200/630',
  'nba-lakers-playoffs-2026': 'https://picsum.photos/seed/nba2026/1200/630',
  'global-economy-2026': 'https://picsum.photos/seed/economy2026/1200/630',
  'healthy-living-guide': 'https://picsum.photos/seed/health2026/1200/630',
  'ai-chip-race-2026': 'https://picsum.photos/seed/chip2026/1200/630',
  'europe-football-transfer-2026': 'https://picsum.photos/seed/football2026/1200/630',
  'ai-education-2026': 'https://picsum.photos/seed/edu2026/1200/630',
  'fashion-week-2026': 'https://picsum.photos/seed/fashion2026/1200/630',
};

const NEWS_ARTICLES = [
  {
    title: '2026 年人工智能发展趋势展望',
    slug: 'ai-trends-2026',
    summary: '从大语言模型到具身智能，AI 技术正在加速渗透各行各业。本文梳理 2026 年最值得关注的五大 AI 趋势。',
    content: `<h2>前言</h2><p>2026 年，人工智能技术继续以前所未有的速度发展。从大语言模型到多模态 AI，从自动驾驶到医疗诊断，AI 正在深刻改变我们的生活方式。</p><h2>趋势一：多模态 AI 成为主流</h2><p>2026 年，多模态 AI 模型将从实验室走向大规模应用。这些模型能够同时理解文本、图像、音频和视频，提供更加自然的人机交互体验。</p><p>企业正在将多模态 AI 集成到客户服务、内容创作和数据分析等场景中，大幅提升工作效率。</p><h2>趋势二：AI Agent 自主执行复杂任务</h2><p>AI Agent 能够理解复杂指令、制定计划并自主执行多步骤任务。从代码开发到市场调研，AI Agent 正在成为各行各业的得力助手。</p><h2>趋势三：端侧 AI 全面普及</h2><p>随着芯片技术的进步，越来越多的 AI 推理任务可以在设备本地完成，无需依赖云端。这不仅降低了延迟，也更好地保护了用户隐私。</p><h2>趋势四：AI 治理框架逐步完善</h2><p>各国政府正在加速制定 AI 监管法规，确保 AI 技术的安全、公平和透明发展。企业也需要建立完善的 AI 治理体系。</p><h2>趋势五：AI 与科学研究深度融合</h2><p>从药物发现到气候建模，AI 正在加速科学研究的进程。2026 年，AI 辅助科研将成为标准配置。</p><blockquote><p>人工智能不是未来，而是现在。拥抱变革，才能引领未来。</p></blockquote>`,
    cover_image_url: null,
    category_slugs: ['ai'],
    is_featured: true,
  },
  {
    title: '最新旗舰手机深度评测：性能与影像的巅峰对决',
    slug: 'flagship-phone-review-2026',
    summary: '本次评测涵盖了三款年度旗舰手机，从处理器性能、影像系统到续航表现，为你提供最全面的购机参考。',
    content: `<p>每年上半年都是旗舰手机发布的高峰期。今年，三大主流厂商分别推出了各自的年度旗舰产品，在性能和影像方面展开了激烈竞争。</p><h2>性能表现</h2><p>三款手机均搭载了最新的旗舰处理器，在 Geekbench 6 测试中，单核性能较上一代提升约 15%，多核性能提升约 20%。在实际游戏测试中，高画质下《原神》和《王者荣耀》均能稳定 60 帧运行。</p><h2>影像系统</h2><p>本次最大的亮点在于影像系统的全面升级。三款手机均配备了一英寸大底主摄，在暗光环境下的表现令人印象深刻。长焦方面，两款手机配备了潜望式长焦镜头，支持 5 倍光学变焦。</p><h2>续航与充电</h2><p>电池容量方面，三款手机均在 5000mAh 以上。其中一款更是达到了 5500mAh，配合 100W 快充，30 分钟即可充至 80%。</p><h2>购买建议</h2><ul><li>追求综合体验：推荐品牌 A 的旗舰款</li><li>注重拍照：推荐品牌 B 的影像旗舰</li><li>预算有限：品牌 C 的标准版性价比最高</li></ul>`,
    cover_image_url: null,
    category_slugs: ['smartphone', 'tech'],
    is_featured: true,
  },
  {
    title: 'NBA 季后赛：湖人队逆转晋级西部决赛',
    slug: 'nba-lakers-playoffs-2026',
    summary: '在刚刚结束的西部半决赛第七场中，洛杉矶湖人队完成 15 分大逆转，以 4-3 的总比分淘汰对手，晋级西部决赛。',
    content: `<p>NBA 季后赛继续进行，在今天结束的一场焦点战中，洛杉矶湖人队在客场完成了一场惊心动魄的大逆转，最终以 112-108 击败对手，以总比分 4-3 晋级西部决赛。</p><h2>比赛回顾</h2><p>比赛开始后，主场作战的球队迅速进入状态，首节就打出了 35-20 的攻击波。湖人队在第二节逐渐找回状态，半场结束时将分差缩小到 12 分。</p><p>下半场易边再战，湖人队在第三节加强了防守强度，单节打出 30-18 的比分，将分差缩小到仅剩 2 分。末节决战，湖人队核心球员挺身而出，连续命中关键球，最终完成逆转。</p><h2>数据统计</h2><ul><li>湖人队：核心球员 35 分 8 篮板 6 助攻</li><li>对手：24 分 10 篮板 3 盖帽</li><li>湖人全队三分命中率：42%</li></ul><p>湖人队将在西部决赛中对阵另一支劲旅，争夺总决赛入场券。</p>`,
    cover_image_url: null,
    category_slugs: ['basketball', 'sports'],
    is_featured: true,
  },
  {
    title: '2026 年世界经济展望：机遇与挑战并存',
    slug: 'global-economy-2026',
    summary: '国际货币基金组织发布最新世界经济展望报告，预测 2026 年全球经济增长率为 3.2%，新兴市场继续成为增长引擎。',
    content: `<p>国际货币基金组织（IMF）今日发布了最新的《世界经济展望报告》，对 2026 年全球经济形势进行了全面分析。</p><h2>总体预测</h2><p>报告预计 2026 年全球经济增长率为 3.2%，与 2025 年基本持平。其中，发达经济体预计增长 1.5%，新兴市场和发展中经济体预计增长 4.5%。</p><h2>主要经济体表现</h2><ul><li>美国：GDP 增速预计为 2.1%，消费支出保持韧性</li><li>欧元区：GDP 增速预计为 1.2%，制造业逐步复苏</li><li>中国：GDP 增速预计为 5.0%，经济结构持续优化</li><li>印度：GDP 增速预计为 6.5%，继续保持快速增长</li></ul><h2>风险因素</h2><p>报告指出，全球经济增长面临的主要风险包括：地缘政治紧张局势升级、通胀反弹可能性、以及部分新兴市场的债务压力。</p><blockquote><p>全球经济正处于缓慢但稳定的复苏轨道上，各国需要加强政策协调，共同应对挑战。</p></blockquote>`,
    cover_image_url: null,
    category_slugs: ['finance'],
    is_featured: false,
  },
  {
    title: '健康生活指南：科学饮食与运动建议',
    slug: 'healthy-living-guide',
    summary: '营养学家和运动医学专家联合推荐的健康生活方式，从饮食结构到运动计划，助你打造科学健康的生活习惯。',
    content: `<p>在快节奏的现代生活中，保持健康的生活方式变得越来越重要。本文综合营养学和运动医学的最新研究，为你提供一份实用的健康生活指南。</p><h2>科学饮食</h2><p>均衡的饮食是健康的基础。专家建议：</p><ul><li>每天摄入 5 份以上的蔬菜水果</li><li>选择全谷物代替精制碳水化合物</li><li>适量摄入优质蛋白质（鱼、禽、豆类）</li><li>限制加工食品和添加糖的摄入</li><li>保持充足的水分摄入（每天 1.5-2 升）</li></ul><h2>运动计划</h2><p>世界卫生组织建议成年人每周进行：</p><ul><li>至少 150 分钟的中等强度有氧运动（如快走、游泳）</li><li>或 75 分钟的高强度有氧运动（如跑步、跳绳）</li><li>每周 2 次以上的力量训练</li></ul><h2>睡眠质量</h2><p>良好的睡眠对健康至关重要。建议成年人保证 7-9 小时的优质睡眠，保持规律的作息时间。</p>`,
    cover_image_url: null,
    category_slugs: ['health'],
    is_featured: false,
  },
  {
    title: '全球科技巨头加大 AI 芯片研发投入',
    slug: 'ai-chip-race-2026',
    summary: '随着 AI 算力需求爆发式增长，各大科技公司纷纷加大自研 AI 芯片的投入，芯片行业竞争格局正在重塑。',
    content: `<p>人工智能的快速发展正在推动芯片行业进入一个全新的竞争时代。从云端训练芯片到端侧推理芯片，各大科技巨头纷纷布局自研 AI 芯片。</p><h2>行业巨头动态</h2><p>据报道，多家科技巨头在 2026 年大幅增加了 AI 芯片的研发预算。其中一家公司的 AI 芯片研发投入同比增长了 60%，达到历史新高。</p><p>自研芯片的优势在于可以为特定 AI 工作负载进行优化，相比通用芯片能提供更高的性能和能效比。</p><h2>市场影响</h2><p>这一趋势正在改变芯片行业的竞争格局。传统芯片制造商面临来自科技巨头自研芯片的竞争压力，同时也在积极推出针对 AI 工作负载优化的新产品。</p><p>分析人士认为，AI 芯片市场的竞争将推动技术创新，最终受益的将是终端用户。</p>`,
    cover_image_url: null,
    category_slugs: ['tech'],
    is_featured: false,
  },
  {
    title: '欧洲足球转会市场：夏季窗口即将开启',
    slug: 'europe-football-transfer-2026',
    summary: '夏季转会窗口即将开启，各大豪门俱乐部已经开始布局，多名顶级球星的转会传闻引发球迷热议。',
    content: `<p>随着赛季接近尾声，欧洲足坛的夏季转会窗口即将拉开帷幕。据多家媒体报道，今年夏季转会市场将异常活跃。</p><h2>重磅传闻</h2><p>目前转会市场上最受关注的几位球员包括：</p><ul><li>一位英超顶级前锋可能转会西甲豪门</li><li>意甲联赛的年轻中场天才吸引多家豪门关注</li><li>德甲联赛的当红新星可能登陆英超</li></ul><h2>转会费预测</h2><p>受通货膨胀影响，今年夏季的转会费可能再创新高。预计将有多笔转会费超过 1 亿欧元的交易。</p><h2>中超动态</h2><p>中超联赛在经历了前几年的调整后，今年转会窗口预计将更加理性，多家俱乐部将重点放在青训和本土球员培养上。</p>`,
    cover_image_url: null,
    category_slugs: ['football', 'sports'],
    is_featured: false,
  },
  {
    title: '在线教育新趋势：AI 个性化学习成为主流',
    slug: 'ai-education-2026',
    summary: '人工智能技术正在重塑在线教育行业，AI 驱动的个性化学习平台为学生提供量身定制的学习路径。',
    content: `<p>教育科技行业正在经历一场由 AI 驱动的深刻变革。传统的"一刀切"教学模式正在被 AI 个性化学习方案所取代。</p><h2>AI 如何改变学习</h2><p>AI 个性化学习平台通过分析学生的学习数据，能够：</p><ul><li>识别学生的知识薄弱点</li><li>自动调整学习内容的难度和节奏</li><li>提供即时反馈和个性化建议</li><li>生成针对性的练习题和复习计划</li></ul><h2>市场前景</h2><p>据市场研究机构预测，全球 AI 教育市场规模将在 2026 年达到 200 亿美元。越来越多的学校和培训机构开始采用 AI 辅助教学工具。</p><h2>挑战与思考</h2><p>尽管 AI 教育前景广阔，但也面临数据隐私、算法公平性和教师角色重新定义等挑战。教育专家强调，AI 应该是教师的辅助工具，而非替代品。</p>`,
    cover_image_url: null,
    category_slugs: ['education'],
    is_featured: false,
  },
  {
    title: '2026 年春季时装周：可持续时尚成为主题',
    slug: 'fashion-week-2026',
    summary: '各大品牌在春季时装周上展示了可持续时尚的最新成果，环保材料与创新设计成为本次时装周的焦点。',
    content: `<p>2026 年春季时装周在全球四大时尚之都相继落幕。本次时装周上，"可持续时尚"成为了贯穿始终的主题。</p><h2>环保材料</h2><p>多个品牌展示了使用创新环保材料制作的服装系列，包括：</p><ul><li>利用海洋塑料回收制成的面料</li><li>菌丝体皮革替代动物皮革</li><li>植物染料取代化学染料</li><li>可生物降解的装饰材料</li></ul><h2>设计亮点</h2><p>本次时装周上，设计师们将可持续理念与美学完美结合，呈现出一系列兼具环保价值和艺术美感的作品。简洁的线条、自然的色调和多功能设计成为了主流趋势。</p>`,
    cover_image_url: null,
    category_slugs: ['education'],
    is_featured: false,
  },
];

// ──────────────────────────────────────────────
// 主流程
// ──────────────────────────────────────────────

async function main() {
  console.log(`\n${CYAN}══════════════════════════════════════${RESET}`);
  console.log(`${CYAN}  NewsHub CMS — 种子数据脚本${RESET}`);
  console.log(`${CYAN}══════════════════════════════════════${RESET}\n`);

  // ─── Step 1: 创建管理员账号 ───
  console.log(`\n${YELLOW}[1/4]${RESET} 创建管理员账号...`);

  // 检查是否已存在
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

  let adminUserId;
  if (existingAdmin) {
    console.log(`  ${YELLOW}⚠${RESET} 用户 ${ADMIN_EMAIL} 已存在，跳过创建`);
    adminUserId = existingAdmin.id;
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (createError) {
      console.error(`  ${RED}✖${RESET} 创建用户失败: ${createError.message}`);
      process.exit(1);
    }

    adminUserId = newUser.user.id;
    console.log(`  ${GREEN}✓${RESET} 管理员账号创建成功: ${ADMIN_EMAIL}`);
  }

  // ─── Step 2: 创建 Profile ───
  console.log(`\n${YELLOW}[2/4]${RESET} 创建管理员档案...`);

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', adminUserId)
    .maybeSingle();

  if (existingProfile) {
    console.log(`  ${YELLOW}⚠${RESET} 管理员档案已存在，跳过创建`);
  } else {
    const { error: profileError } = await supabase.from('profiles').insert({
      auth_id: adminUserId,
      email: ADMIN_EMAIL,
      display_name: ADMIN_DISPLAY_NAME,
      role: 'super_admin',
      is_active: true,
    });

    if (profileError) {
      console.error(`  ${RED}✖${RESET} 创建档案失败: ${profileError.message}`);
      process.exit(1);
    }
    console.log(`  ${GREEN}✓${RESET} 管理员档案创建成功`);
  }

  // ─── Step 3: 创建分类 ───
  console.log(`\n${YELLOW}[3/4]${RESET} 创建示例分类...`);

  // 先获取已有分类的 slug
  const { data: existingCats } = await supabase.from('categories').select('slug');
  const existingSlugs = new Set((existingCats ?? []).map((c) => c.slug));

  // 先创建父分类（无 parent_slug 的）
  const slugToId = {};
  for (const cat of CATEGORIES) {
    if (cat.parent_slug) continue; // 子分类后面再处理

    if (existingSlugs.has(cat.slug)) {
      const { data } = await supabase.from('categories').select('id').eq('slug', cat.slug).single();
      slugToId[cat.slug] = data?.id;
      console.log(`  ${YELLOW}⚠${RESET} 分类 "${cat.name}" 已存在，跳过`);
      continue;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sort_order: cat.sort_order,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  ${RED}✖${RESET} 创建分类 "${cat.name}" 失败: ${error.message}`);
    } else {
      slugToId[cat.slug] = data.id;
      console.log(`  ${GREEN}✓${RESET} 分类 "${cat.name}" 创建成功`);
    }
  }

  // 再创建子分类
  for (const cat of CATEGORIES) {
    if (!cat.parent_slug) continue;

    if (existingSlugs.has(cat.slug)) {
      const { data } = await supabase.from('categories').select('id').eq('slug', cat.slug).single();
      slugToId[cat.slug] = data?.id;
      console.log(`  ${YELLOW}⚠${RESET} 子分类 "${cat.name}" 已存在，跳过`);
      continue;
    }

    const parentId = slugToId[cat.parent_slug];
    if (!parentId) {
      console.error(`  ${RED}✖${RESET} 创建子分类 "${cat.name}" 失败: 父分类 "${cat.parent_slug}" 未找到`);
      continue;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parent_id: parentId,
        sort_order: cat.sort_order,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  ${RED}✖${RESET} 创建子分类 "${cat.name}" 失败: ${error.message}`);
    } else {
      slugToId[cat.slug] = data.id;
      console.log(`  ${GREEN}✓${RESET} 子分类 "${cat.name}" 创建成功`);
    }
  }

  // ─── Step 4: 创建示例新闻 ───
  console.log(`\n${YELLOW}[4/4]${RESET} 创建示例新闻...`);

  // 获取 admin 的 profile id
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_id', adminUserId)
    .single();

  if (!adminProfile) {
    console.error(`  ${RED}✖${RESET} 未找到管理员档案，无法创建新闻`);
    process.exit(1);
  }

  // 检查已有新闻
  const { count: existingNewsCount } = await supabase
    .from('news')
    .select('*', { count: 'exact', head: true });

  if (existingNewsCount && existingNewsCount > 0) {
    console.log(`  ${YELLOW}⚠${RESET} 数据库中已有 ${existingNewsCount} 条新闻，跳过创建`);
  } else {
    let successCount = 0;
    for (const article of NEWS_ARTICLES) {
      const publishedAt = new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: news, error: newsError } = await supabase
        .from('news')
        .insert({
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          cover_image_url: article.cover_image_url || ARTICLE_IMAGES[article.slug] || null,
          author_id: adminProfile.id,
          status: 'published',
          is_featured: article.is_featured,
          published_at: publishedAt,
        })
        .select('id')
        .single();

      if (newsError) {
        console.error(`  ${RED}✖${RESET} 创建新闻 "${article.title}" 失败: ${newsError.message}`);
        continue;
      }

      // 关联分类
      const categoryIds = article.category_slugs
        .map((slug) => slugToId[slug])
        .filter(Boolean);

      if (categoryIds.length > 0) {
        const { error: catError } = await supabase.from('news_categories').insert(
          categoryIds.map((category_id) => ({
            news_id: news.id,
            category_id,
          })),
        );

        if (catError) {
          console.error(`  ${YELLOW}⚠${RESET} 新闻 "${article.title}" 分类关联失败: ${catError.message}`);
        }
      }

      successCount++;
      console.log(`  ${GREEN}✓${RESET} 新闻 "${article.title}" 创建成功${article.is_featured ? ' ★置顶' : ''}`);
    }
    console.log(`\n  ${GREEN}共创建 ${successCount}/${NEWS_ARTICLES.length} 条新闻${RESET}`);
  }

  // ─── 完成 ───
  console.log(`\n${CYAN}══════════════════════════════════════${RESET}`);
  console.log(`${GREEN}  ✅ 种子数据创建完成${RESET}`);
  console.log(`${CYAN}══════════════════════════════════════${RESET}`);
  console.log(`\n  后台登录地址: ${SUPABASE_URL.replace('.supabase.co', '')}`);
  console.log(`  邮箱: ${YELLOW}${ADMIN_EMAIL}${RESET}`);
  console.log(`  密码: ${YELLOW}${ADMIN_PASSWORD}${RESET}`);
  console.log(`\n  请先启动开发服务器: npm run dev`);
  console.log(`  然后打开: http://localhost:3000/admin/login\n`);
}

main().catch(console.error);
