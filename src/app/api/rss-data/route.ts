import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

export interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  category?: string;
  keywords: string[];
  source: string;
}

export interface TrendingData {
  keywords: string[];
  hashtags: string[];
  topics: string[];
  themes: string[];
  articles: RSSArticle[];
  lastUpdated: Date;
  hashtagAnalytics?: {
    trending: Array<{ hashtag: string; frequency: number; momentum: 'rising' | 'stable' | 'declining' }>;
    byCategory: Record<string, string[]>;
    byLocation: Record<string, string[]>;
  };
}

// RSS feed URLs for different categories
const RSS_FEEDS = {
  tech: [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ],
  business: [
    'https://feeds.bloomberg.com/markets/news.rss',
    'https://feeds.reuters.com/reuters/businessNews'
  ],
  general: [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.cnn.com/rss/edition.rss'
  ]
};

async function fetchRSSFeed(url: string): Promise<RSSArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`RSS API: Failed to fetch RSS feed: ${url} - Status: ${response.status}`);
      return [];
    }

    const xmlData = await response.text();
    const result = await parseStringPromise(xmlData);

    const articles: RSSArticle[] = [];
    const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];

    for (const item of items.slice(0, 10)) { // Limit to 10 articles per feed
      const title = item.title?.[0]?._ || item.title?.[0] || '';
      const description = item.description?.[0]?._ || item.description?.[0] || item.summary?.[0]?._ || item.summary?.[0] || '';
      const link = item.link?.[0]?.$ || item.link?.[0] || '';
      const pubDate = new Date(item.pubDate?.[0] || item.published?.[0] || Date.now());

      if (title && description) {
        articles.push({
          title: typeof title === 'string' ? title : title.toString(),
          description: typeof description === 'string' ? description : description.toString(),
          link: typeof link === 'string' ? link : link.toString(),
          pubDate,
          keywords: extractKeywords(title + ' ' + description),
          source: new URL(url).hostname
        });
      }
    }

    return articles;
  } catch (error) {
    console.error(`RSS API: Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word));

  // Count frequency and return top keywords
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

function generateHashtags(keywords: string[]): string[] {
  return keywords.map(keyword =>
    '#' + keyword.replace(/\s+/g, '').toLowerCase()
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const limit = parseInt(searchParams.get('limit') || '50');

    const feedUrls = RSS_FEEDS[category as keyof typeof RSS_FEEDS] || RSS_FEEDS.general;

    // Fetch articles from all feeds in parallel
    const allArticlesPromises = feedUrls.map(url => fetchRSSFeed(url));
    const allArticlesArrays = await Promise.all(allArticlesPromises);
    const allArticles = allArticlesArrays.flat();

    // If no articles were fetched, return fallback data
    if (allArticles.length === 0) {
      console.warn('RSS API: No articles fetched from any feed, returning fallback data');
      return NextResponse.json({
        keywords: ['business', 'technology', 'innovation', 'growth', 'success'],
        hashtags: ['#business', '#technology', '#innovation', '#growth', '#success'],
        topics: ['business', 'technology', 'innovation'],
        themes: ['business', 'technology', 'innovation', 'growth', 'success'],
        articles: [],
        lastUpdated: new Date(),
        hashtagAnalytics: {
          trending: [
            { hashtag: '#business', frequency: 10, momentum: 'rising' as const },
            { hashtag: '#technology', frequency: 8, momentum: 'rising' as const }
          ],
          byCategory: {
            [category]: ['#business', '#technology', '#innovation']
          },
          byLocation: {}
        }
      });
    }

    // Sort by publication date and limit results
    const sortedArticles = allArticles
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, limit);

    // Extract trending data
    const allKeywords = sortedArticles.flatMap(article => article.keywords);
    const keywordFrequency: Record<string, number> = {};
    allKeywords.forEach(keyword => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });

    const trendingKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword]) => keyword);

    const hashtags = generateHashtags(trendingKeywords);

    const trendingData: TrendingData = {
      keywords: trendingKeywords,
      hashtags,
      topics: trendingKeywords.slice(0, 10),
      themes: trendingKeywords.slice(0, 15),
      articles: sortedArticles,
      lastUpdated: new Date(),
      hashtagAnalytics: {
        trending: trendingKeywords.slice(0, 10).map(keyword => ({
          hashtag: '#' + keyword,
          frequency: keywordFrequency[keyword],
          momentum: 'rising' as const
        })),
        byCategory: {
          [category]: hashtags.slice(0, 10)
        },
        byLocation: {}
      }
    };

    return NextResponse.json(trendingData);
  } catch (error) {
    console.error('Error in RSS API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS data' },
      { status: 500 }
    );
  }
}
