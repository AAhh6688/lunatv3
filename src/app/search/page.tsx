/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */
'use client';

import { ChevronUp, Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import {
  addSearchHistory,
  clearSearchHistory,
  deleteSearchHistory,
  getSearchHistory,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { SearchResult } from '@/lib/types';

import PageLayout from '@/components/PageLayout';
import VideoCard from '@/components/VideoCard';

// 定义过滤关键词列表（从附件文档中提取的所有关键词）
// 包括日文、简体中文、繁体中文、英文
// 我将它们放入一个大数组中，忽略大小写进行匹配（在过滤函数中处理）
const FILTER_KEYWORDS = [
  // 日文关键词 (从文档A到G部分)
  'アダルト', 'AV', '裏', 'エロ', 'ポルノ', 'R18', 'R18+', '禁断', '密着', '無修正', 'モザイク消し',
  '素人', '巨乳', '美乳', '人妻', '熟女', '女子校生', 'JK', '女子大生', 'JD', 'お姉さん', '義母',
  '不倫', '近親相姦', '痴漢', '強制', '監禁', '调教', 'SM', '緊縛', '露出', '盗撮', 'のぞき',
  '中出し', 'フェラ', 'クンニ', '手コキ', 'パイズリ', 'イラマチオ', '本番', '生中出し', '顔射',
  'ぶっかけ', '射精', '絶頂', '潮吹き', 'バイブ', '玩具', 'コスプレ', '制服', '競泳水着', '下着', 'パンティー',
  '看護師', 'ナース', 'OL', '先生', '教師', '家庭教師', 'メイド', 'ＣＡ', 'モデル', 'アイドル', '美少女', '若妻',
  '乱交', 'ハメ撮り', '逆レイプ', '陵辱', 'レイプ', '拘束', '野外', '公共の場', '温泉', '混浴', '介護', '催眠', '媚薬', '放置', 'アナル',
  'マニア', 'フェチ', 'お蔵入り', '独占', '先行配信', '見放題', '激安', '無料', 'フル', '高画質',
  'ヤリたい', 'ヤル', 'イッちゃう', '気持ちいい', '感じまくり', 'ガチ', 'ナンパ', '逆ナン', '合コン', '援交', 'パパ活', 'ホスト', '风俗', 'ソープ', 'デリヘル',

  // 简体中文关键词 (从核心过滤关键词列表1到4部分，以及其它)
  '国产', '原创', '自拍', '无码', '偷拍', '街拍', '探花', '大神', '实录', '破解', '流出', '泄露', '全集', '资源', '网盘', '成人', '色情', '伦理', '三级', '片', '写真', '美女', '嫩模', '网红', '外围', '约炮', '直播', '漏点', '露点', '大尺度', '精品', '精选', '重磅', '新作', '福利', '车牌', '番号',
  '学生', '校花', '学姐', '教师', '老师', '女教', '护士', '制服', '空姐', 'OL', '白领', '少妇', '人妻', '熟女', '良家', '邻家', '妹子', '小姐姐', '女神', '女友', '前任', '闺蜜', '继母', '小姨', '嫂子', '婆婆', '同事', '老板', '中介', '外卖', '快递', '房东', '保姆', '萝莉',
  '做爱', '啪啪', '房事', '激情', '缠绵', '肉搏', '内射', '中出', '颜射', '口交', '深喉', '吹箫', '打炮', '打飞机', '自慰', '慰藉', '抠抠', '震动', '潮吹', '高潮', '射精', '喷射', '喷水', '巨乳', '大胸', '美胸', '翘臀', '私处', '阴部', '下体', '玉足', '丝袜', '黑丝', '肉丝', '网袜', '捆绑', '调教', 'SM',
  '强奸', '强迫', '迷奸', '诱奸', '轮奸', '暴力', '血腥', '虐待', '凌辱', '禁锢', '监禁', '反抗', '惨叫', '伦理', '乱伦', '父女', '母子', '姐弟', '兄妹', '公公', '媳妇', '叔叔', '侄女', '爷爷', '孙女', '禁断', '野战', '野外', '车震', '酒店', '宾馆', '洗手间', '公厕',
  '吃瓜', '黑料', '实锤', '不雅视频', 'XX门', '视频流出', '完整版', '反转', '爆料', '新作', '成人版', '苹果', '手机',

  // 繁体中文关键词 (对应简体部分)
  '國產', '原創', '自拍', '無碼', '偷拍', '街拍', '探花', '大神', '實錄', '破解', '流出', '洩露', '全集', '資源', '網盤', '成人', '色情', '倫理', '三級', '片', '寫真', '美女', '嫩模', '網紅', '外圍', '約砲', '直播', '漏點', '露點', '大尺度', '精品', '精選', '重磅', '新作', '福利', '車牌', '番號',
  '學生', '校花', '學姐', '教師', '老師', '女教', '護士', '制服', '空姐', 'OL', '白領', '少婦', '人妻', '熟女', '良家', '鄰家', '妹子', '小姐姐', '女神', '女友', '前任', '閨蜜', '繼母', '小姨', '嫂子', '婆婆', '同事', '老闆', '中介', '外賣', '快遞', '房東', '保姆', '蘿莉',
  '做愛', '啪啪', '房事', '激情', '纏綿', '肉搏', '內射', '中出', '顏射', '口交', '深喉', '吹簫', '打砲', '打飛機', '自慰', '慰藉', '摳摳', '震動', '潮吹', '高潮', '射精', '噴射', '噴水', '巨乳', '大胸', '美胸', '翹臀', '私處', '陰部', '下體', '玉足', '絲襪', '黑絲', '肉絲', '網襪', '捆綁', '調教', 'SM',
  '強姦', '強迫', '迷姦', '誘姦', '輪姦', '暴力', '血腥', '虐待', '凌辱', '禁錮', '監禁', '反抗', '慘叫', '倫理', '亂倫', '父女', '母子', '姐弟', '兄妹', '公公', '媳婦', '叔叔', '侄女', '爺爺', '孫女', '禁斷', '野戰', '野外', '車震', '酒店', '賓館', '洗手間', '公廁',

  // 英文关键词 (核心和进阶)
  'Porn', 'Adult', 'Hentai', 'Uncensored', 'Amateur', 'Erotica', 'Hardcore', 'BDSM', 'Incest', 'Creampie', 'Blowjob', 'BJ', 'Facial', 'Cum', 'Ejaculation', 'Fetish', 'Milf', 'Teen', 'Orgy', 'Gangbang', 'Hidden', 'Spy', 'Cam', 'Webcam', 'Nude', 'Naked', 'XXX',
  'POV', 'Squirt', 'Swinger', 'Taboo', 'Deepthroat', 'Handjob', 'HJ', 'Threesome', '3P', 'Anal', 'Masturbation', 'Big Dick', 'Cock', 'Cuckold', 'Double Penetration', 'Interracial', 'Massage', 'Submissive', 'Bondage', 'Voyeur', 'Busty', 'Squirting', 'Erotic'
];

// 过滤函数：检查字符串是否包含任何过滤关键词（忽略大小写）
function containsFilteredKeyword(text: string): boolean {
  const lowerText = text.toLowerCase();
  return FILTER_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

function SearchPageClient() {
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // 返回顶部按钮显示状态
  const [showBackToTop, setShowBackToTop] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // 新增：用户年龄确认状态（默认假设未成年，需要用户确认）
  // 作为新手友好设计，我们添加一个简单的年龄确认弹窗或开关
  const [isAdultUser, setIsAdultUser] = useState(false); // 默认 false，视为未成年
  const [showAgeConfirm, setShowAgeConfirm] = useState(true); // 初次加载显示确认对话框

  // 获取默认聚合设置：只读取用户本地设置，默认为 true
  const getDefaultAggregate = () => {
    if (typeof window !== 'undefined') {
      const userSetting = localStorage.getItem('defaultAggregateSearch');
      if (userSetting !== null) {
        return JSON.parse(userSetting);
      }
    }
    return true; // 默认启用聚合
  };

  const [viewMode, setViewMode] = useState<'agg' | 'all'>(() => {
    return getDefaultAggregate() ? 'agg' : 'all';
  });

  // 聚合后的结果（按标题和年份分组）
  const aggregatedResults = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    searchResults.forEach((item) => {
      // 使用 title + year + type 作为键，year 必然存在，但依然兜底 'unknown'
      const key = `${item.title.replaceAll(' ', '')}-${
        item.year || 'unknown'
      }-${item.episodes.length === 1 ? 'movie' : 'tv'}`;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    });
    return Array.from(map.entries()).sort((a, b) => {
      // 优先排序：标题与搜索词完全一致的排在前面
      const aExactMatch = a[1][0].title
        .replaceAll(' ', '')
        .includes(searchQuery.trim().replaceAll(' ', ''));
      const bExactMatch = b[1][0].title
        .replaceAll(' ', '')
        .includes(searchQuery.trim().replaceAll(' ', ''));

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      // 年份排序
      if (a[1][0].year === b[1][0].year) {
        return a[0].localeCompare(b[0]);
      } else {
        // 处理 unknown 的情况
        const aYear = a[1][0].year;
        const bYear = b[1][0].year;

        if (aYear === 'unknown' && bYear === 'unknown') {
          return 0;
        } else if (aYear === 'unknown') {
          return 1; // a 排在后面
        } else if (bYear === 'unknown') {
          return -1; // b 排在后面
        } else {
          // 都是数字年份，按数字大小排序（大的在前面）
          return aYear > bYear ? -1 : 1;
        }
      }
    });
  }, [searchResults]);

  useEffect(() => {
    // 无搜索参数时聚焦搜索框
    !searchParams.get('q') && document.getElementById('searchInput')?.focus();

    // 初始加载搜索历史
    getSearchHistory().then(setSearchHistory);

    // 监听搜索历史更新事件
    const unsubscribe = subscribeToDataUpdates(
      'searchHistoryUpdated',
      (newHistory: string[]) => {
        setSearchHistory(newHistory);
      }
    );

    // 获取滚动位置的函数 - 专门针对 body 滚动
    const getScrollTop = () => {
      return document.body.scrollTop || 0;
    };

    // 使用 requestAnimationFrame 持续检测滚动位置
    let isRunning = false;
    const checkScrollPosition = () => {
      if (!isRunning) return;

      const scrollTop = getScrollTop();
      const shouldShow = scrollTop > 300;
      setShowBackToTop(shouldShow);

      requestAnimationFrame(checkScrollPosition);
    };

    // 启动持续检测
    isRunning = true;
    checkScrollPosition();

    // 监听 body 元素的滚动事件
    const handleScroll = () => {
      const scrollTop = getScrollTop();
      setShowBackToTop(scrollTop > 300);
    };

    document.body.addEventListener('scroll', handleScroll, { passive: true });

    // 新增：从 localStorage 加载用户年龄确认（持久化）
    if (typeof window !== 'undefined') {
      const savedAdultStatus = localStorage.getItem('isAdultUser');
      if (savedAdultStatus === 'true') {
        setIsAdultUser(true);
        setShowAgeConfirm(false);
      }
    }

    return () => {
      unsubscribe();
      isRunning = false; // 停止 requestAnimationFrame 循环

      // 移除 body 滚动事件监听器
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // 当搜索参数变化时更新搜索状态
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      fetchSearchResults(query);

      // 保存到搜索历史 (事件监听会自动更新界面)
      addSearchHistory(query);
    } else {
      setShowResults(false);
    }
  }, [searchParams]);

  const fetchSearchResults = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();
      let results = data.results.sort((a: SearchResult, b: SearchResult) => {
        // 优先排序：标题与搜索词完全一致的排在前面
        const aExactMatch = a.title === query.trim();
        const bExactMatch = b.title === query.trim();

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;

        // 如果都匹配或都不匹配，则按原来的逻辑排序
        if (a.year === b.year) {
          return a.title.localeCompare(b.title);
        } else {
          // 处理 unknown 的情况
          if (a.year === 'unknown' && b.year === 'unknown') {
            return 0;
          } else if (a.year === 'unknown') {
            return 1; // a 排在后面
          } else if (b.year === 'unknown') {
            return -1; // b 排在后面
          } else {
            // 都是数字年份，按数字大小排序（大的在前面）
            return parseInt(a.year) > parseInt(b.year) ? -1 : 1;
          }
        }
      });

      // 新增：如果用户不是成人，过滤掉包含关键词的结果
      if (!isAdultUser) {
        results = results.filter((item: SearchResult) => !containsFilteredKeyword(item.title));
      }

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim().replace(/\s+/g, ' ');
    if (!trimmed) return;

    // 回显搜索框
    setSearchQuery(trimmed);
    setIsLoading(true);
    setShowResults(true);

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    // 直接发请求
    fetchSearchResults(trimmed);

    // 保存到搜索历史 (事件监听会自动更新界面)
    addSearchHistory(trimmed);
  };

  // 返回顶部功能
  const scrollToTop = () => {
    try {
      // 根据调试结果，真正的滚动容器是 document.body
      document.body.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      // 如果平滑滚动完全失败，使用立即滚动
      document.body.scrollTop = 0;
    }
  };

  // 新增：处理年龄确认
  const confirmAdult = () => {
    setIsAdultUser(true);
    setShowAgeConfirm(false);
    // 保存到 localStorage，坚持下次访问
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAdultUser', 'true');
    }
    // 重新获取搜索结果（如果有当前搜索）
    if (searchQuery) {
      fetchSearchResults(searchQuery);
    }
  };

  const denyAdult = () => {
    setShowAgeConfirm(false);
    // 可选：显示警告或重定向，但这里简单关闭对话框，保持过滤
  };

  return (
    <PageLayout activePath='/search'>
      <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible mb-10'>
        {/* 新增：年龄确认对话框（简单模态） */}
        {showAgeConfirm && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full'>
              <h2 className='text-lg font-bold mb-4 text-gray-800 dark:text-gray-200'>
                年龄确认
              </h2>
              <p className='mb-6 text-gray-600 dark:text-gray-400'>
                本应用包含可能不适合未成年人的内容。您是否已满18岁？
              </p>
              <div className='flex justify-end gap-4'>
                <button
                  onClick={denyAdult}
                  className='px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded'
                >
                  否（过滤内容）
                </button>
                <button
                  onClick={confirmAdult}
                  className='px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded'
                >
                  是（显示全部）
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 搜索框 */}
        <div className='mb-8'>
          <form onSubmit={handleSearch} className='max-w-2xl mx-auto'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500' />
              <input
                id='searchInput'
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='搜索电影、电视剧...'
                className='w-full h-12 rounded-lg bg-gray-50/80 py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white border border-gray-200/50 shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:bg-gray-700 dark:border-gray-700'
              />
            </div>
          </form>
        </div>

        {/* 搜索结果或搜索历史 */}
        <div className='max-w-[95%] mx-auto mt-12 overflow-visible'>
          {isLoading ? (
            <div className='flex justify-center items-center h-40'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-500'></div>
            </div>
          ) : showResults ? (
            <section className='mb-12'>
              {/* 标题 + 聚合开关 */}
              <div className='mb-8 flex items-center justify-between'>
                <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                  搜索结果
                </h2>
                {/* 聚合开关 */}
                <label className='flex items-center gap-2 cursor-pointer select-none'>
                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                    聚合
                  </span>
                  <div className='relative'>
                    <input
                      type='checkbox'
                      className='sr-only peer'
                      checked={viewMode === 'agg'}
                      onChange={() =>
                        setViewMode(viewMode === 'agg' ? 'all' : 'agg')
                      }
                    />
                    <div className='w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600'></div>
                    <div className='absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4'></div>
                  </div>
                </label>
              </div>
              <div
                key={`search-results-${viewMode}`}
                className='justify-start grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8'
              >
                {viewMode === 'agg'
                  ? aggregatedResults.map(([mapKey, group]) => {
                      return (
                        <div key={`agg-${mapKey}`} className='w-full'>
                          <VideoCard
                            from='search'
                            items={group}
                            query={
                              searchQuery.trim() !== group[0].title
                                ? searchQuery.trim()
                                : ''
                            }
                          />
                        </div>
                      );
                    })
                  : searchResults.map((item) => (
                      <div
                        key={`all-${item.source}-${item.id}`}
                        className='w-full'
                      >
                        <VideoCard
                          id={item.id}
                          title={item.title}
                          poster={item.poster}
                          episodes={item.episodes.length}
                          source={item.source}
                          source_name={item.source_name}
                          douban_id={item.douban_id?.toString()}
                          query={
                            searchQuery.trim() !== item.title
                              ? searchQuery.trim()
                              : ''
                          }
                          year={item.year}
                          from='search'
                          type={item.episodes.length > 1 ? 'tv' : 'movie'}
                        />
                      </div>
                    ))}
                {searchResults.length === 0 && (
                  <div className='col-span-full text-center text-gray-500 py-8 dark:text-gray-400'>
                    未找到相关结果
                  </div>
                )}
              </div>
            </section>
          ) : searchHistory.length > 0 ? (
            // 搜索历史
            <section className='mb-12'>
              <h2 className='mb-4 text-xl font-bold text-gray-800 text-left dark:text-gray-200'>
                搜索历史
                {searchHistory.length > 0 && (
                  <button
                    onClick={() => {
                      clearSearchHistory(); // 事件监听会自动更新界面
                    }}
                    className='ml-3 text-sm text-gray-500 hover:text-red-500 transition-colors dark:text-gray-400 dark:hover:text-red-500'
                  >
                    清空
                  </button>
                )}
              </h2>
              <div className='flex flex-wrap gap-2'>
                {searchHistory.map((item) => (
                  <div key={item} className='relative group'>
                    <button
                      onClick={() => {
                        setSearchQuery(item);
                        router.push(
                          `/search?q=${encodeURIComponent(item.trim())}`
                        );
                      }}
                      className='px-4 py-2 bg-gray-500/10 hover:bg-gray-300 rounded-full text-sm text-gray-700 transition-colors duration-200 dark:bg-gray-700/50 dark:hover:bg-gray-600 dark:text-gray-300'
                    >
                      {item}
                    </button>
                    {/* 删除按钮 */}
                    <button
                      aria-label='删除搜索历史'
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteSearchHistory(item); // 事件监听会自动更新界面
                      }}
                      className='absolute -top-1 -right-1 w-4 h-4 opacity-0 group-hover:opacity-100 bg-gray-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] transition-colors'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* 返回顶部悬浮按钮 */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 md:bottom-6 right-6 z-[500] w-12 h-12 bg-green-500/90 hover:bg-green-500 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out flex items-center justify-center group ${
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label='返回顶部'
      >
        <ChevronUp className='w-6 h-6 transition-transform group-hover:scale-110' />
      </button>
    </PageLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
