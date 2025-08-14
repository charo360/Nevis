// Design Analytics Firebase service
import { query, where, orderBy, limit, getDocs, collection } from 'firebase/firestore';
import { db } from '../config';
import { DatabaseService } from '../database';
import { COLLECTIONS, DesignAnalyticsDocument, DesignAnalyticsDocumentSchema } from '../schema';

export interface DesignAnalyticsData {
  designId: string;
  businessType: string;
  platform: string;
  visualStyle: string;
  qualityScore: number;
  designElements: {
    colorPalette: string[];
    typography: string;
    composition: string;
    trends: string[];
    businessDNA: string;
  };
  predictions: {
    engagement: number;
    brandAlignment: number;
    technicalQuality: number;
    trendRelevance: number;
  };
}

export class DesignAnalyticsService extends DatabaseService<DesignAnalyticsDocument> {
  constructor() {
    super(COLLECTIONS.DESIGN_ANALYTICS);
  }

  // Record design generation analytics
  async recordDesignGeneration(
    userId: string,
    data: DesignAnalyticsData
  ): Promise<string> {
    const firestoreData: Omit<DesignAnalyticsDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      designId: data.designId,
      businessType: data.businessType,
      platform: data.platform,
      visualStyle: data.visualStyle,
      generatedAt: new Date(),
      metrics: {
        qualityScore: data.qualityScore,
        engagementPrediction: data.predictions.engagement,
        brandAlignmentScore: data.predictions.brandAlignment,
        technicalQuality: data.predictions.technicalQuality,
        trendRelevance: data.predictions.trendRelevance,
      },
      designElements: data.designElements,
      tags: [
        data.businessType,
        data.platform,
        data.visualStyle,
      ],
    };

    // Validate data
    const validatedData = DesignAnalyticsDocumentSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }).parse(firestoreData);

    return await this.create(validatedData);
  }

  // Get performance insights for a business type
  async getPerformanceInsights(
    userId: string,
    businessType: string,
    options?: {
      platform?: string;
      limit?: number;
      daysBack?: number;
    }
  ): Promise<{
    averageQuality: number;
    averageEngagement: number;
    averageBrandAlignment: number;
    topPerformingStyles: string[];
    trendingElements: string[];
    totalDesigns: number;
  }> {
    let q = query(
      collection(db, COLLECTIONS.DESIGN_ANALYTICS),
      where('userId', '==', userId),
      where('businessType', '==', businessType),
      orderBy('generatedAt', 'desc')
    );

    if (options?.platform) {
      q = query(q, where('platform', '==', options.platform));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DesignAnalyticsDocument[];

    // Filter by date if specified
    let filteredDocs = docs;
    if (options?.daysBack) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.daysBack);
      
      filteredDocs = docs.filter(doc => {
        const docDate = doc.generatedAt instanceof Date ? doc.generatedAt : new Date();
        return docDate >= cutoffDate;
      });
    }

    if (filteredDocs.length === 0) {
      return {
        averageQuality: 0,
        averageEngagement: 0,
        averageBrandAlignment: 0,
        topPerformingStyles: [],
        trendingElements: [],
        totalDesigns: 0,
      };
    }

    // Calculate averages
    const totalQuality = filteredDocs.reduce((sum, doc) => sum + doc.metrics.qualityScore, 0);
    const totalEngagement = filteredDocs.reduce((sum, doc) => sum + doc.metrics.engagementPrediction, 0);
    const totalBrandAlignment = filteredDocs.reduce((sum, doc) => sum + doc.metrics.brandAlignmentScore, 0);

    // Find top performing styles
    const stylePerformance = new Map<string, { total: number; count: number }>();
    filteredDocs.forEach(doc => {
      const current = stylePerformance.get(doc.visualStyle) || { total: 0, count: 0 };
      stylePerformance.set(doc.visualStyle, {
        total: current.total + doc.metrics.qualityScore,
        count: current.count + 1,
      });
    });

    const topPerformingStyles = Array.from(stylePerformance.entries())
      .map(([style, data]) => ({ style, average: data.total / data.count }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)
      .map(item => item.style);

    // Find trending elements
    const elementCounts = new Map<string, number>();
    filteredDocs.forEach(doc => {
      doc.designElements.trends.forEach(trend => {
        elementCounts.set(trend, (elementCounts.get(trend) || 0) + 1);
      });
    });

    const trendingElements = Array.from(elementCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(item => item[0]);

    return {
      averageQuality: totalQuality / filteredDocs.length,
      averageEngagement: totalEngagement / filteredDocs.length,
      averageBrandAlignment: totalBrandAlignment / filteredDocs.length,
      topPerformingStyles,
      trendingElements,
      totalDesigns: filteredDocs.length,
    };
  }

  // Update design performance with actual metrics
  async updateDesignPerformance(
    designId: string,
    actualMetrics: {
      actualEngagement?: number;
      actualReach?: number;
      conversionRate?: number;
    }
  ): Promise<void> {
    const q = query(
      collection(db, COLLECTIONS.DESIGN_ANALYTICS),
      where('designId', '==', designId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const doc = querySnapshot.docs[0];
    const currentData = doc.data() as DesignAnalyticsDocument;

    const updatedPerformance = {
      ...currentData.performance,
      ...actualMetrics,
      updatedAt: new Date(),
    };

    await this.update(doc.id, { performance: updatedPerformance });
  }

  // Get design analytics by date range
  async getAnalyticsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options?: {
      businessType?: string;
      platform?: string;
    }
  ): Promise<DesignAnalyticsDocument[]> {
    let q = query(
      collection(db, COLLECTIONS.DESIGN_ANALYTICS),
      where('userId', '==', userId),
      where('generatedAt', '>=', startDate),
      where('generatedAt', '<=', endDate),
      orderBy('generatedAt', 'desc')
    );

    if (options?.businessType) {
      q = query(q, where('businessType', '==', options.businessType));
    }

    if (options?.platform) {
      q = query(q, where('platform', '==', options.platform));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as DesignAnalyticsDocument[];
  }

  // Get performance patterns for optimization
  async getPerformancePatterns(
    userId: string,
    businessType: string
  ): Promise<{
    bestPerformingCombinations: Array<{
      visualStyle: string;
      platform: string;
      averageScore: number;
      count: number;
    }>;
    colorPalettePerformance: Array<{
      colors: string[];
      averageScore: number;
      count: number;
    }>;
    typographyPerformance: Array<{
      typography: string;
      averageScore: number;
      count: number;
    }>;
  }> {
    const docs = await this.getByUserId(userId, {
      limit: 1000, // Get more data for pattern analysis
    });

    const businessTypeDocs = docs.filter(doc => doc.businessType === businessType);

    // Analyze style-platform combinations
    const combinations = new Map<string, { total: number; count: number }>();
    businessTypeDocs.forEach(doc => {
      const key = `${doc.visualStyle}-${doc.platform}`;
      const current = combinations.get(key) || { total: 0, count: 0 };
      combinations.set(key, {
        total: current.total + doc.metrics.qualityScore,
        count: current.count + 1,
      });
    });

    const bestPerformingCombinations = Array.from(combinations.entries())
      .map(([key, data]) => {
        const [visualStyle, platform] = key.split('-');
        return {
          visualStyle,
          platform,
          averageScore: data.total / data.count,
          count: data.count,
        };
      })
      .filter(item => item.count >= 3) // Only include combinations with enough data
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    // Analyze color palette performance (simplified)
    const colorPerformance = new Map<string, { total: number; count: number }>();
    businessTypeDocs.forEach(doc => {
      const colorKey = doc.designElements.colorPalette.sort().join(',');
      const current = colorPerformance.get(colorKey) || { total: 0, count: 0 };
      colorPerformance.set(colorKey, {
        total: current.total + doc.metrics.qualityScore,
        count: current.count + 1,
      });
    });

    const colorPalettePerformance = Array.from(colorPerformance.entries())
      .map(([colorKey, data]) => ({
        colors: colorKey.split(','),
        averageScore: data.total / data.count,
        count: data.count,
      }))
      .filter(item => item.count >= 2)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    // Analyze typography performance
    const typographyPerformance = new Map<string, { total: number; count: number }>();
    businessTypeDocs.forEach(doc => {
      const current = typographyPerformance.get(doc.designElements.typography) || { total: 0, count: 0 };
      typographyPerformance.set(doc.designElements.typography, {
        total: current.total + doc.metrics.qualityScore,
        count: current.count + 1,
      });
    });

    const typographyPerformanceArray = Array.from(typographyPerformance.entries())
      .map(([typography, data]) => ({
        typography,
        averageScore: data.total / data.count,
        count: data.count,
      }))
      .filter(item => item.count >= 2)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    return {
      bestPerformingCombinations,
      colorPalettePerformance,
      typographyPerformance: typographyPerformanceArray,
    };
  }
}

// Export singleton instance
export const designAnalyticsFirebaseService = new DesignAnalyticsService();
