// Social Media Scraping System for Brand Intelligence
// Scrapes public social media content without APIs

interface InstagramPost {
  id: string;
  shortcode: string;
  caption: string;
  timestamp: number;
  likes: number;
  comments: number;
  imageUrl: string;
  isVideo: boolean;
  hashtags: string[];
  mentions: string[];
}

interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  profilePicUrl: string;
  externalUrl?: string;
  businessCategory?: string;
  isBusinessAccount: boolean;
}

interface SocialMediaData {
  instagram?: {
    profile: InstagramProfile;
    posts: InstagramPost[];
    engagement: {
      averageLikes: number;
      averageComments: number;
      engagementRate: number;
      topPerformingPosts: InstagramPost[];
    };
    contentAnalysis: {
      topHashtags: Array<{ tag: string; count: number }>;
      contentThemes: string[];
      postingFrequency: {
        postsPerWeek: number;
        mostActiveDay: string;
        mostActiveHour: number;
      };
    };
  };
  facebook?: {
    profile: any;
    posts: any[];
  };
  twitter?: {
    profile: any;
    tweets: any[];
  };
  linkedin?: {
    profile: any;
    posts: any[];
  };
}

export class SocialMediaScraper {
  private userAgents: string[];
  private requestDelay: number;
  private maxRetries: number;

  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/109.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    this.requestDelay = 2000; // 2 seconds between requests
    this.maxRetries = 3;
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRandomSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async scrapeInstagramProfile(username: string): Promise<{ profile: InstagramProfile; posts: InstagramPost[] } | null> {
    console.log(`📸 Scraping Instagram profile: @${username}`);

    try {
      // Method 1: Try JSON endpoint first
      const jsonData = await this.scrapeInstagramJSON(username);
      if (jsonData) {
        return jsonData;
      }

      // Method 2: Fallback to HTML scraping
      console.log('📸 JSON method failed, trying HTML scraping...');
      return await this.scrapeInstagramHTML(username);

    } catch (error) {
      console.error(`❌ Failed to scrape Instagram @${username}:`, error.message);
      return null;
    }
  }

  private async scrapeInstagramJSON(username: string): Promise<{ profile: InstagramProfile; posts: InstagramPost[] } | null> {
    try {
      const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'X-Requested-With': 'XMLHttpRequest',
          'X-IG-App-ID': '936619743392459', // Instagram web app ID
          'X-ASBD-ID': '129477',
          'X-IG-WWW-Claim': '0',
          'Origin': 'https://www.instagram.com',
          'Referer': `https://www.instagram.com/${username}/`,
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.graphql?.user) {
        throw new Error('Invalid JSON response structure');
      }

      const user = data.graphql.user;
      const posts = user.edge_owner_to_timeline_media?.edges || [];

      const profile: InstagramProfile = {
        username: user.username,
        fullName: user.full_name || '',
        biography: user.biography || '',
        followers: user.edge_followed_by?.count || 0,
        following: user.edge_follow?.count || 0,
        posts: user.edge_owner_to_timeline_media?.count || 0,
        isVerified: user.is_verified || false,
        profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || '',
        externalUrl: user.external_url,
        businessCategory: user.business_category_name,
        isBusinessAccount: user.is_business_account || false
      };

      const instagramPosts: InstagramPost[] = posts.slice(0, 24).map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          shortcode: node.shortcode,
          caption: node.edge_media_to_caption?.edges[0]?.node?.text || '',
          timestamp: node.taken_at_timestamp * 1000,
          likes: node.edge_media_preview_like?.count || 0,
          comments: node.edge_media_to_comment?.count || 0,
          imageUrl: node.display_url || node.thumbnail_src,
          isVideo: node.is_video || false,
          hashtags: this.extractHashtags(node.edge_media_to_caption?.edges[0]?.node?.text || ''),
          mentions: this.extractMentions(node.edge_media_to_caption?.edges[0]?.node?.text || '')
        };
      });

      console.log(`✅ Successfully scraped @${username}: ${instagramPosts.length} posts`);
      return { profile, posts: instagramPosts };

    } catch (error) {
      console.log(`⚠️ Instagram JSON scraping failed for @${username}:`, error.message);
      return null;
    }
  }

  private async scrapeInstagramHTML(username: string): Promise<{ profile: InstagramProfile; posts: InstagramPost[] } | null> {
    try {
      const url = `https://www.instagram.com/${username}/`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Extract JSON data from HTML
      const jsonMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
      if (!jsonMatch) {
        // Try alternative pattern
        const altMatch = html.match(/"ProfilePage"\s*:\s*\[({.+?})\]/);
        if (!altMatch) {
          throw new Error('Could not find Instagram data in HTML');
        }
      }

      const jsonData = JSON.parse(jsonMatch?.[1] || '{}');
      const userData = jsonData.entry_data?.ProfilePage?.[0]?.graphql?.user;

      if (!userData) {
        throw new Error('Could not extract user data from HTML');
      }

      // Parse profile data similar to JSON method
      const profile: InstagramProfile = {
        username: userData.username,
        fullName: userData.full_name || '',
        biography: userData.biography || '',
        followers: userData.edge_followed_by?.count || 0,
        following: userData.edge_follow?.count || 0,
        posts: userData.edge_owner_to_timeline_media?.count || 0,
        isVerified: userData.is_verified || false,
        profilePicUrl: userData.profile_pic_url_hd || userData.profile_pic_url || '',
        externalUrl: userData.external_url,
        businessCategory: userData.business_category_name,
        isBusinessAccount: userData.is_business_account || false
      };

      const posts = userData.edge_owner_to_timeline_media?.edges || [];
      const instagramPosts: InstagramPost[] = posts.slice(0, 12).map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          shortcode: node.shortcode,
          caption: node.edge_media_to_caption?.edges[0]?.node?.text || '',
          timestamp: node.taken_at_timestamp * 1000,
          likes: node.edge_media_preview_like?.count || 0,
          comments: node.edge_media_to_comment?.count || 0,
          imageUrl: node.display_url || node.thumbnail_src,
          isVideo: node.is_video || false,
          hashtags: this.extractHashtags(node.edge_media_to_caption?.edges[0]?.node?.text || ''),
          mentions: this.extractMentions(node.edge_media_to_caption?.edges[0]?.node?.text || '')
        };
      });

      console.log(`✅ Successfully scraped @${username} via HTML: ${instagramPosts.length} posts`);
      return { profile, posts: instagramPosts };

    } catch (error) {
      console.log(`❌ Instagram HTML scraping failed for @${username}:`, error.message);
      return null;
    }
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map(tag => tag.toLowerCase());
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@[a-zA-Z0-9_.]+/g;
    const matches = text.match(mentionRegex) || [];
    return matches.map(mention => mention.substring(1)); // Remove @ symbol
  }

  async scrapeMultiplePlatforms(handles: Record<string, string>): Promise<SocialMediaData> {
    const socialData: SocialMediaData = {};

    // Scrape Instagram if handle exists
    if (handles.instagram) {
      console.log(`🔍 Starting Instagram analysis for @${handles.instagram}`);
      const instagramData = await this.scrapeInstagramProfile(handles.instagram);
      
      if (instagramData) {
        socialData.instagram = {
          profile: instagramData.profile,
          posts: instagramData.posts,
          engagement: this.calculateInstagramEngagement(instagramData.posts, instagramData.profile.followers),
          contentAnalysis: this.analyzeInstagramContent(instagramData.posts)
        };
      }

      // Respectful delay between platform requests
      await this.delay(this.requestDelay);
    }

    // Add other platforms here (Facebook, Twitter, LinkedIn)
    // For now, focusing on Instagram as it's most commonly used for brand analysis

    return socialData;
  }

  private calculateInstagramEngagement(posts: InstagramPost[], followers: number): any {
    if (posts.length === 0) {
      return {
        averageLikes: 0,
        averageComments: 0,
        engagementRate: 0,
        topPerformingPosts: []
      };
    }

    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
    const averageLikes = totalLikes / posts.length;
    const averageComments = totalComments / posts.length;
    
    const engagementRate = followers > 0 ? ((averageLikes + averageComments) / followers) * 100 : 0;
    
    const topPerformingPosts = posts
      .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
      .slice(0, 5);

    return {
      averageLikes: Math.round(averageLikes),
      averageComments: Math.round(averageComments),
      engagementRate: Math.round(engagementRate * 100) / 100,
      topPerformingPosts
    };
  }

  private analyzeInstagramContent(posts: InstagramPost[]): any {
    // Analyze hashtags
    const hashtagCounts: Record<string, number> = {};
    posts.forEach(post => {
      post.hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    // Analyze content themes
    const contentThemes = this.extractContentThemes(posts.map(p => p.caption).join(' '));

    // Analyze posting patterns
    const postDates = posts.map(p => new Date(p.timestamp));
    const postsPerWeek = posts.length > 0 ? (posts.length / this.getWeekSpan(postDates)) : 0;
    
    const dayOfWeekCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    
    postDates.forEach(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayOfWeekCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';
    
    const mostActiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 12;

    return {
      topHashtags,
      contentThemes,
      postingFrequency: {
        postsPerWeek: Math.round(postsPerWeek * 10) / 10,
        mostActiveDay,
        mostActiveHour: parseInt(mostActiveHour.toString())
      }
    };
  }

  private extractContentThemes(allCaptions: string): string[] {
    const themeKeywords = {
      'product': ['product', 'new', 'launch', 'available', 'shop', 'buy'],
      'lifestyle': ['life', 'living', 'daily', 'routine', 'experience'],
      'behind-the-scenes': ['behind', 'process', 'making', 'team', 'work'],
      'educational': ['learn', 'tip', 'how', 'guide', 'tutorial', 'advice'],
      'promotional': ['sale', 'discount', 'offer', 'deal', 'limited', 'special'],
      'community': ['community', 'together', 'family', 'thank', 'grateful'],
      'inspiration': ['inspire', 'motivate', 'dream', 'achieve', 'success']
    };

    const captionsLower = allCaptions.toLowerCase();
    const themes: string[] = [];

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (captionsLower.split(keyword).length - 1);
      }, 0);

      if (score > 2) {
        themes.push(theme);
      }
    }

    return themes;
  }

  private getWeekSpan(dates: Date[]): number {
    if (dates.length === 0) return 1;
    
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return Math.max(diffWeeks, 1);
  }
}
