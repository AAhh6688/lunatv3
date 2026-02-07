/**
 * 通用内容过滤系统 - 支持多平台部署
 * 兼容：Cloudflare Pages/Workers, Vercel, Docker, Node.js
 * 
 * 使用方法：
 * - Cloudflare Pages Functions: 作为 Functions 中间件
 * - Vercel Edge Functions: 作为边缘函数
 * - Docker/Node.js: 作为 Express 中间件或工具函数
 */

class ContentFilter {
  constructor() {
    // 日文关键词
    this.japaneseKeywords = [
      'アダルト', 'AV', '裏', 'エロ', 'ポルノ', 'R18', 'R18+', '禁断', '密着', 
      '無修正', 'モザイク消し', '素人', '巨乳', '美乳', '人妻', '熟女', '女子校生', 
      'JK', '女子大生', 'JD', 'お姉さん', '義母', '不倫', '近親相姦', '痴漢', 
      '強制', '監禁', '調教', 'SM', '緊縛', '露出', '盗撮', 'のぞき', '中出し', 
      'フェラ', 'クンニ', '手コキ', 'パイズリ', 'イラマチオ', '本番', '生中出し', 
      '顔射', 'ぶっかけ', '射精', '絶頂', '潮吹き', 'バイブ', '玩具', 'コスプレ', 
      '制服', '競泳水着', '下着', 'パンティー', '看護師', 'ナース', 'OL', '先生', 
      '教師', '家庭教師', 'メイド', 'ＣＡ', 'モデル', 'アイドル', '美少女', '若妻', 
      '乱交', 'ハメ撮り', '逆レイプ', '陵辱', 'レイプ', '拘束', '野外', '公共の場', 
      '温泉', '混浴', '介護', '催眠', '媚薬', '放置', 'アナル', 'マニア', 'フェチ', 
      'お蔵入り', '独占', '先行配信', '見放題', '激安', '無料', 'フル', '高画質', 
      'ヤリたい', 'ヤル', 'イッちゃう', '気持ちいい', '感じまくり', 'ガチ', 'ナンパ', 
      '逆ナン', '合コン', '援交', 'パパ活', 'ホスト', '風俗', 'ソープ', 'デリヘル'
    ];

    // 中文简体关键词
    this.chineseSimplifiedKeywords = [
      '国产', '原创', '自拍', '无码', '偷拍', '街拍', '探花', '大神', '实录', 
      '破解', '流出', '泄露', '全集', '资源', '网盘', '成人', '色情', '伦理', 
      '三级', '片', '写真', '美女', '嫩模', '网红', '外围', '约炮', '直播', 
      '漏点', '露点', '大尺度', '精品', '精选', '重磅', '新作', '福利', '车牌', 
      '番号', '学生', '校花', '学姐', '教师', '老师', '女教', '护士', '制服', 
      '空姐', 'OL', '白领', '少妇', '人妻', '熟女', '良家', '邻家', '妹子', 
      '小姐姐', '女神', '女友', '前任', '闺蜜', '继母', '小姨', '嫂子', '婆婆', 
      '同事', '老板', '中介', '外卖', '快递', '房东', '保姆', '萝莉', '做爱', 
      '啪啪', '房事', '激情', '缠绵', '肉搏', '内射', '中出', '颜射', '口交', 
      '深喉', '吹箫', '打炮', '打飞机', '自慰', '慰藉', '抠抠', '震动', '潮吹', 
      '高潮', '射精', '喷射', '喷水', '巨乳', '大胸', '美胸', '翘臀', '私处', 
      '阴部', '下体', '玉足', '丝袜', '黑丝', '肉丝', '网袜', '捆绑', '调教', 
      'SM', '强奸', '强迫', '迷奸', '诱奸', '轮奸', '暴力', '血腥', '虐待', 
      '凌辱', '禁锢', '监禁', '反抗', '惨叫', '伦理', '乱伦', '父女', '母子', 
      '姐弟', '兄妹', '公公', '媳妇', '叔叔', '侄女', '爷爷', '孙女', '禁断', 
      '野战', '野外', '车震', '酒店', '宾馆', '洗手间', '公厕', '吃瓜', '黑料', 
      '实锤', '不雅视频', '门', '视频流出', '完整版', '反转', '爆料', '新作', 
      '成人版', '苹果', '手机'
    ];

    // 中文繁体关键词
    this.chineseTraditionalKeywords = [
      '國產', '原創', '自拍', '無碼', '偷拍', '街拍', '探花', '大神', '實錄', 
      '破解', '流出', '洩露', '全集', '資源', '網盤', '成人', '色情', '倫理', 
      '三級', '片', '寫真', '美女', '嫩模', '網紅', '外圍', '約砲', '直播', 
      '漏點', '露點', '大尺度', '精品', '精選', '重磅', '新作', '福利', '車牌', 
      '番號', '學生', '校花', '學姐', '教師', '老師', '女教', '護士', '制服', 
      '空姐', 'OL', '白領', '少婦', '人妻', '熟女', '良家', '鄰家', '妹子', 
      '小姐姐', '女神', '女友', '前任', '閨蜜', '繼母', '小姨', '嫂子', '婆婆', 
      '同事', '老闆', '中介', '外賣', '快遞', '房東', '保姆', '蘿莉', '做愛', 
      '啪啪', '房事', '激情', '纏綿', '肉搏', '內射', '中出', '顏射', '口交', 
      '深喉', '吹簫', '打砲', '打飛機', '自慰', '慰藉', '摳摳', '震動', '潮吹', 
      '高潮', '射精', '噴射', '噴水', '巨乳', '大胸', '美胸', '翹臀', '私處', 
      '陰部', '下體', '玉足', '絲襪', '黑絲', '肉絲', '網襪', '捆綁', '調教', 
      'SM', '強姦', '強迫', '迷姦', '誘姦', '輪姦', '暴力', '血腥', '虐待', 
      '凌辱', '禁錮', '監禁', '反抗', '慘叫', '倫理', '亂倫', '父女', '母子', 
      '姐弟', '兄妹', '公公', '媳婦', '叔叔', '侄女', '爺爺', '孫女', '禁斷', 
      '野戰', '野外', '車震', '酒店', '賓館', '洗手間', '公廁'
    ];

    // 英文关键词
    this.englishKeywords = [
      'porn', 'adult', 'hentai', 'uncensored', 'amateur', 'erotica', 'hardcore', 
      'bdsm', 'incest', 'creampie', 'blowjob', 'bj', 'facial', 'cum', 'ejaculation', 
      'fetish', 'milf', 'teen', 'orgy', 'gangbang', 'hidden', 'spy', 'cam', 
      'webcam', 'nude', 'naked', 'xxx', 'pov', 'squirt', 'swinger', 'taboo', 
      'deepthroat', 'handjob', 'hj', 'threesome', '3p', 'anal', 'masturbation', 
      'big dick', 'cock', 'cuckold', 'double penetration', 'interracial', 
      'massage', 'submissive', 'bondage', 'voyeur', 'busty', 'squirting', 
      'erotic', 'sex', 'nsfw', 'rape', 'violence', 'gore', 'bloody', 'torture',
      'abuse', 'assault', 'molest', 'pervert', 'lolita', 'underage', 'minor',
      'child', 'cp', 'jailbait', 'preteen', 'pedo', 'pedophile'
    ];

    // 合并所有关键词
    this.allKeywords = [
      ...this.japaneseKeywords,
      ...this.chineseSimplifiedKeywords,
      ...this.chineseTraditionalKeywords,
      ...this.englishKeywords
    ];
  }

  /**
   * 检查文本是否包含敏感关键词
   */
  checkContent(text) {
    if (!text || typeof text !== 'string') {
      return { isBlocked: false, matchedKeywords: [] };
    }

    const lowerText = text.toLowerCase();
    const matchedKeywords = [];

    for (const keyword of this.allKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    return {
      isBlocked: matchedKeywords.length > 0,
      matchedKeywords: matchedKeywords
    };
  }

  /**
   * 过滤视频列表
   */
  filterVideos(videos) {
    if (!Array.isArray(videos)) {
      return [];
    }

    return videos.filter(video => {
      // 检查标题
      if (this.checkContent(video.title || '').isBlocked) return false;
      
      // 检查描述
      if (this.checkContent(video.description || '').isBlocked) return false;
      
      // 检查标签
      if (Array.isArray(video.tags)) {
        for (const tag of video.tags) {
          if (this.checkContent(tag).isBlocked) return false;
        }
      }
      
      // 检查频道名称
      if (this.checkContent(video.channelName || '').isBlocked) return false;
      
      return true;
    });
  }

  /**
   * Express/Node.js 中间件
   */
  expressMiddleware() {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        if (data && Array.isArray(data.videos)) {
          data.videos = this.filterVideos(data.videos);
        } else if (Array.isArray(data)) {
          data = this.filterVideos(data);
        }
        return originalJson(data);
      };
      next();
    };
  }

  /**
   * Cloudflare Pages Functions 处理器
   */
  async handleCloudflareRequest(request, env, context) {
    try {
      // 处理 CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }

      // 获取原始响应（需要传入下一个处理器）
      const response = await context.next();
      const data = await response.json();

      // 过滤数据
      let filteredData = data;
      if (Array.isArray(data)) {
        filteredData = this.filterVideos(data);
      } else if (data.videos && Array.isArray(data.videos)) {
        filteredData = {
          ...data,
          videos: this.filterVideos(data.videos),
          total: this.filterVideos(data.videos).length
        };
      }

      return new Response(JSON.stringify(filteredData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Vercel Edge Function 处理器
   */
  async handleVercelRequest(request) {
    try {
      // 处理 CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }

      // 从请求体或 URL 参数获取数据
      let data;
      if (request.method === 'POST') {
        data = await request.json();
      } else {
        // GET 请求，需要从其他源获取数据
        const url = new URL(request.url);
        const apiUrl = url.searchParams.get('api');
        if (apiUrl) {
          const response = await fetch(apiUrl);
          data = await response.json();
        }
      }

      // 过滤数据
      let filteredData = data;
      if (Array.isArray(data)) {
        filteredData = this.filterVideos(data);
      } else if (data && data.videos && Array.isArray(data.videos)) {
        filteredData = {
          ...data,
          videos: this.filterVideos(data.videos),
          total: this.filterVideos(data.videos).length
        };
      }

      return new Response(JSON.stringify(filteredData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// ==================== 导出配置 ====================

// 创建单例
const contentFilter = new ContentFilter();

// Node.js/CommonJS 导出（Docker, 传统 Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = contentFilter;
  module.exports.ContentFilter = ContentFilter;
  module.exports.default = contentFilter;
}

// ES Module 导出（Vercel, 现代前端）
if (typeof exports !== 'undefined') {
  exports.contentFilter = contentFilter;
  exports.ContentFilter = ContentFilter;
  exports.default = contentFilter;
}

// 浏览器全局变量
if (typeof window !== 'undefined') {
  window.ContentFilter = ContentFilter;
  window.contentFilter = contentFilter;
}

// Cloudflare Workers/Pages 导出
if (typeof globalThis !== 'undefined') {
  globalThis.ContentFilter = ContentFilter;
  globalThis.contentFilter = contentFilter;
}

// ES6 默认导出
export { ContentFilter, contentFilter };
export default contentFilter;
