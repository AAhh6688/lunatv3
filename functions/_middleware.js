/**
 * Cloudflare Pages Functions - 内容过滤中间件
 * 
 * 文件位置：functions/api/videos.js 或 functions/_middleware.js
 */

import { contentFilter } from '../../content-filter-universal.js';

// ==================== 方法一：作为中间件（推荐）====================
// 文件名：functions/_middleware.js
// 这会自动应用到所有 /api/* 路由

export async function onRequest(context) {
  const { request, next, env } = context;

  // 处理 CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // 获取原始响应
  const response = await next();
  
  // 如果不是 JSON，直接返回
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return response;
  }

  try {
    const data = await response.json();

    // 过滤数据
    let filteredData = data;
    if (Array.isArray(data)) {
      filteredData = contentFilter.filterVideos(data);
    } else if (data.videos && Array.isArray(data.videos)) {
      filteredData = {
        ...data,
        videos: contentFilter.filterVideos(data.videos),
        total: contentFilter.filterVideos(data.videos).length
      };
    }

    // 返回过滤后的响应
    return new Response(JSON.stringify(filteredData), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    // 如果解析 JSON 失败，返回原始响应
    return response;
  }
}

// ==================== 方法二：单个路由处理器 ====================
// 文件名：functions/api/videos.js

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // 从你的数据源获取视频
    // 示例：从 KV 存储或外部 API
    const response = await fetch(`${env.BACKEND_API}/videos`);
    const videos = await response.json();

    // 过滤视频
    const filteredVideos = contentFilter.filterVideos(videos);

    return new Response(JSON.stringify(filteredVideos), {
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

// ==================== 方法三：搜索路由处理器 ====================
// 文件名：functions/api/search.js

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  // 检查搜索词是否敏感
  const queryCheck = contentFilter.checkContent(query);
  if (queryCheck.isBlocked) {
    return new Response(JSON.stringify({
      error: 'Search query contains inappropriate content',
      results: []
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 执行搜索
    const response = await fetch(`${env.BACKEND_API}/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();

    // 过滤结果
    const filteredResults = contentFilter.filterVideos(results);

    return new Response(JSON.stringify(filteredResults), {
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
