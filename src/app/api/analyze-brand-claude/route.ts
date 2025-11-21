/**
 * Claude-enhanced Brand Analysis API Route
 * Drop-in replacement for existing brand analysis with Claude's advanced capabilities
 */

import { NextRequest, NextResponse } from 'next/server';

// Increase timeout for Claude analysis (60 seconds)
export const maxDuration = 60; // Maximum execution time in seconds

export async function POST(request: NextRequest) {
  console.log('🎯 [analyze-brand-claude] POST endpoint called');
  
  try {
    const body = await request.json();
    console.log('📦 [analyze-brand-claude] Request body:', body);
    
    const { websiteUrl, businessType, includeCompetitorAnalysis = false } = body;

    if (!websiteUrl) {
      console.error('❌ [analyze-brand-claude] No websiteUrl provided');
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🔍 Starting Claude brand analysis for: ${websiteUrl}`);
    console.log(`🏢 Business type: ${businessType || 'auto-detect'}`);

    // In development, always use localhost to avoid calling production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment 
      ? 'http://localhost:3001' 
      : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001');
    
    const apiUrl = `${baseUrl}/api/analyze-website-claude`;
    console.log('📡 Calling website analysis API:', apiUrl);

    const analysisResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl,
        analysisType: businessType === 'services' ? 'services' : 'products'
      })
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('❌ analyze-website-claude failed:', {
        status: analysisResponse.status,
        statusText: analysisResponse.statusText,
        body: errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(errorData.error || `Analysis failed with status ${analysisResponse.status}`);
    }

    const analysisResult = await analysisResponse.json();
    
    if (!analysisResult.success) {
      throw new Error(analysisResult.error || 'Analysis failed');
    }

    // Transform Claude result to brand analysis format with enhanced details
    const data = analysisResult.data;

    // Debug: Log the raw data structure
    console.log('📊 [analyze-brand-claude] Raw data structure:', JSON.stringify({
      has_business_analysis: !!data.business_analysis,
      has_store_info: !!data.store_info,
      has_company_info: !!data.company_info,
      has_products: !!data.products,
      products_count: data.products?.length || 0,
      has_services: !!data.services,
      services_count: data.services?.length || 0,
      has_services_offered: !!data.services_offered,
      services_offered_count: data.services_offered?.length || 0,
      has_payment_options: !!data.payment_options,
      payment_options_count: data.payment_options?.length || 0,
      has_delivery_info: !!data.delivery_info,
      store_specialties: data.store_info?.specialties?.length || 0,
      company_specialties: data.company_info?.specialties?.length || 0,
      company_certifications: data.company_info?.certifications?.length || 0,
    }, null, 2));

    // Extract business analysis details
    const businessAnalysis = data.business_analysis || {};
    const storeInfo = data.store_info || {};
    const companyInfo = data.company_info || {};
    
    // Build detailed services/products description - Focus on individual products for retail
    let detailedServices = '';
    if (data.products && data.products.length > 0) {
      // For e-commerce/retail businesses - Separate product name from description
      const productEntries = data.products.map((product: any) => {
        // Clean product name (keep it very short for UI)
        let productName = product.name;
        
        // Shorten product names to avoid UI truncation (max 30 characters)
        if (productName.length > 30) {
          productName = productName.substring(0, 27) + '...';
        }
        
        // Build comprehensive description with ALL details
        const descriptionParts: string[] = [];
        
        // Add product description first
        if (product.description) {
          descriptionParts.push(product.description);
        }
        
        // Add price information
        if (product.price) {
          descriptionParts.push(product.price);
        }
        
        // Add specifications
        if (product.specifications && product.specifications.length > 0) {
          descriptionParts.push(`Specifications: ${product.specifications.join(', ')}`);
        }
        
        // Add payment options
        if (product.payment_options && product.payment_options.length > 0) {
          descriptionParts.push(`Payment Options: ${product.payment_options.join(', ')}`);
        }
        
        // Add availability
        if (product.availability) {
          descriptionParts.push(`Availability: ${product.availability}`);
        }
        
        // Format as: "Product Name: Detailed Description" (using colon separator that the UI expects)
        const fullDescription = descriptionParts.join('. ');
        
        return `${productName}: ${fullDescription}`;
      });
      
      detailedServices = productEntries.join('\n\n');
    } else if (data.services) {
      // For service businesses
      detailedServices = data.services.map((svc: any) => {
        let serviceDesc = `**${svc.service_name}**\n`;
        if (svc.detailed_description) {
          serviceDesc += `${svc.detailed_description}\n`;
        }
        if (svc.benefits && svc.benefits.length > 0) {
          serviceDesc += `Benefits: ${svc.benefits.join(', ')}\n`;
        }
        if (svc.pricing_model) {
          serviceDesc += `Pricing: ${svc.pricing_model}\n`;
        }
        if (svc.target_clients) {
          serviceDesc += `Target Clients: ${svc.target_clients}\n`;
        }
        return serviceDesc;
      }).join('\n');
    }
    
    // Build detailed business description
    const detailedDescription = storeInfo.detailed_description || 
                               companyInfo.detailed_description || 
                               storeInfo.description || 
                               companyInfo.description || 
                               'Professional business providing quality products and services';
    
    // Extract key features from product categories (unique categories only)
    let keyFeatures = '';
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      const categories = [...new Set(
        data.products
          .map((p: any) => p.category)
          .filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '')
      )];
      if (categories.length > 0) {
        keyFeatures = categories.join('\n');
      }
    } else if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      // Extract service names and features
      const serviceFeatures: string[] = [];
      data.services.forEach((svc: any) => {
        if (svc.service_name && typeof svc.service_name === 'string' && svc.service_name.trim() !== '') {
          serviceFeatures.push(svc.service_name);
        }
        // Also add key features from each service
        if (svc.features && Array.isArray(svc.features)) {
          const validFeatures = svc.features
            .filter((f: any) => f && typeof f === 'string' && f.trim() !== '')
            .slice(0, 2); // Add top 2 features per service
          serviceFeatures.push(...validFeatures);
        }
      });
      if (serviceFeatures.length > 0) {
        keyFeatures = serviceFeatures.join('\n');
      }
    }

    // If still empty, try to extract from company/store info
    if (!keyFeatures || keyFeatures.trim() === '') {
      const fallbackFeatures: string[] = [];

      // From specialties
      if (storeInfo.specialties && Array.isArray(storeInfo.specialties) && storeInfo.specialties.length > 0) {
        const validSpecialties = storeInfo.specialties.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
        fallbackFeatures.push(...validSpecialties);
      } else if (companyInfo.specialties && Array.isArray(companyInfo.specialties) && companyInfo.specialties.length > 0) {
        const validSpecialties = companyInfo.specialties.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
        fallbackFeatures.push(...validSpecialties);
      }

      // From certifications
      if (companyInfo.certifications && Array.isArray(companyInfo.certifications) && companyInfo.certifications.length > 0) {
        const validCerts = companyInfo.certifications.filter((c: any) => c && typeof c === 'string' && c.trim() !== '');
        fallbackFeatures.push(...validCerts);
      }

      keyFeatures = fallbackFeatures.length > 0
        ? fallbackFeatures.join('\n')
        : 'Professional services\nQuality products\nCustomer satisfaction';
    }

    // Extract competitive advantages from multiple sources
    const competitiveAdvantagesList: string[] = [];

    // From specialties (these are often competitive advantages)
    if (storeInfo.specialties && Array.isArray(storeInfo.specialties) && storeInfo.specialties.length > 0) {
      const validSpecialties = storeInfo.specialties.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
      competitiveAdvantagesList.push(...validSpecialties);
    } else if (companyInfo.specialties && Array.isArray(companyInfo.specialties) && companyInfo.specialties.length > 0) {
      const validSpecialties = companyInfo.specialties.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
      competitiveAdvantagesList.push(...validSpecialties);
    }

    // From services offered (like delivery, warranty, etc.)
    if (data.services_offered && Array.isArray(data.services_offered) && data.services_offered.length > 0) {
      const validServices = data.services_offered.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
      competitiveAdvantagesList.push(...validServices);
    }

    // From payment options (e.g., "Lipa Polepole available")
    if (data.payment_options && Array.isArray(data.payment_options) && data.payment_options.length > 0) {
      const validPayments = data.payment_options.filter((p: any) => p && typeof p === 'string' && p.trim() !== '');
      competitiveAdvantagesList.push(...validPayments);
    }

    // From delivery info
    if (data.delivery_info && data.delivery_info.methods && Array.isArray(data.delivery_info.methods) && data.delivery_info.methods.length > 0) {
      competitiveAdvantagesList.push('Delivery available');
      if (data.delivery_info.coverage && typeof data.delivery_info.coverage === 'string' && data.delivery_info.coverage.trim() !== '') {
        competitiveAdvantagesList.push(`Coverage: ${data.delivery_info.coverage}`);
      }
    }

    // From certifications
    if (companyInfo.certifications && Array.isArray(companyInfo.certifications) && companyInfo.certifications.length > 0) {
      const validCerts = companyInfo.certifications.filter((c: any) => c && typeof c === 'string' && c.trim() !== '');
      competitiveAdvantagesList.push(...validCerts);
    }

    // From service benefits (extract unique benefits across all services)
    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      const allBenefits: string[] = [];
      data.services.forEach((svc: any) => {
        if (svc.benefits && Array.isArray(svc.benefits)) {
          const validBenefits = svc.benefits.filter((b: any) => b && typeof b === 'string' && b.trim() !== '');
          allBenefits.push(...validBenefits);
        }
      });
      // Add unique benefits (limit to avoid duplication)
      const uniqueBenefits = [...new Set(allBenefits)].slice(0, 3);
      competitiveAdvantagesList.push(...uniqueBenefits);
    }

    // Filter out any empty strings that might have slipped through
    const filteredAdvantages = competitiveAdvantagesList.filter(adv => adv && adv.trim() !== '');

    // Ensure we have at least some competitive advantages
    const competitiveAdvantages = filteredAdvantages.length > 0
      ? filteredAdvantages.join('\n')
      : 'Quality products and services\nCompetitive pricing\nExcellent customer service\nFast delivery\nProfessional expertise';
    
    // Extract content themes from various sources
    const contentThemesList: string[] = [];

    // From business type and industry
    if (businessAnalysis.industry) {
      const industryThemes: { [key: string]: string[] } = {
        'technology': ['Innovation', 'Digital Solutions', 'Tech Excellence'],
        'fashion': ['Style', 'Trends', 'Quality Fashion'],
        'food': ['Quality Ingredients', 'Taste', 'Customer Satisfaction'],
        'health': ['Wellness', 'Care', 'Health Excellence'],
        'education': ['Learning', 'Growth', 'Knowledge'],
        'finance': ['Trust', 'Security', 'Financial Growth'],
        'retail': ['Quality Products', 'Customer Service', 'Value'],
        'electronics': ['Innovation', 'Technology', 'Quality Products'],
      };

      const industryLower = businessAnalysis.industry.toLowerCase();
      for (const [key, themes] of Object.entries(industryThemes)) {
        if (industryLower.includes(key)) {
          contentThemesList.push(...themes);
          break;
        }
      }
    }

    // From specialties
    if (storeInfo.specialties && storeInfo.specialties.length > 0) {
      contentThemesList.push(...storeInfo.specialties.slice(0, 2));
    } else if (companyInfo.specialties && companyInfo.specialties.length > 0) {
      contentThemesList.push(...companyInfo.specialties.slice(0, 2));
    }

    // From writing tone (extract key themes)
    if (data.writing_tone) {
      const toneThemes = data.writing_tone.toLowerCase();
      if (toneThemes.includes('professional')) contentThemesList.push('Professionalism');
      if (toneThemes.includes('customer')) contentThemesList.push('Customer Focus');
      if (toneThemes.includes('innovative')) contentThemesList.push('Innovation');
      if (toneThemes.includes('quality')) contentThemesList.push('Quality');
    }

    // Default themes if none found
    if (contentThemesList.length === 0) {
      contentThemesList.push('Quality', 'Innovation', 'Customer Service', 'Professional Excellence');
    }

    // Remove duplicates and join
    const contentThemes = [...new Set(contentThemesList)].join(', ');

    // Debug logging to help identify missing data
    console.log('🔍 [analyze-brand-claude] Extracted data summary:');
    console.log(`  - Key Features (${keyFeatures.split('\n').filter(f => f.trim()).length} items):`);
    console.log(`    ${keyFeatures.substring(0, 300)}`);
    console.log(`  - Competitive Advantages (${filteredAdvantages.length} items):`);
    console.log(`    ${competitiveAdvantages.substring(0, 300)}`);
    console.log(`  - Content Themes (${contentThemesList.length} items): ${contentThemes}`);
    console.log(`  - Services/Products: ${detailedServices.length} chars`);

    const brandAnalysis = {
      businessName: storeInfo.name || companyInfo.name || 'Business Name',
      description: detailedDescription,
      businessType: businessAnalysis.business_type || businessType || (data.store_info ? 'E-commerce Store' : 'Service Business'),
      industry: businessAnalysis.industry || 'General Business',
      targetAudience: businessAnalysis.target_market || 'General customers',

      // Enhanced services/products description (KEEP AS IS - WORKING PERFECTLY)
      services: detailedServices || 'Professional services and products',

      // Enhanced key features from unique product categories
      keyFeatures: keyFeatures || 'Quality features and services',

      // Enhanced competitive advantages from multiple sources
      competitiveAdvantages: competitiveAdvantages,

      // Dynamic content themes based on business analysis
      contentThemes: contentThemes,

      brandPersonality: businessAnalysis.business_model || 'Professional and customer-focused',
      
      contactInfo: {
        phone: data.contact_info?.phone || data.contact?.phone || '',
        email: data.contact_info?.email || data.contact?.email || '',
        address: data.contact_info?.address || data.contact?.address || '',
        website: websiteUrl,
        hours: data.contact_info?.hours || data.contact?.hours || ''
      },
      
      // Additional enhanced fields
      location: storeInfo.location || companyInfo.location || '',
      established: storeInfo.established || companyInfo.established || '',
      businessModel: businessAnalysis.business_model || '',
      
      // Visual style extracted from website design
      visualStyle: data.visual_style || 'Modern and professional design with product-focused imagery',
      
      // Writing tone extracted from website content
      writingTone: data.writing_tone || 'Professional and customer-focused',
      
      analysisTimestamp: Date.now(),
      dataCompleteness: 95 // Higher completeness with enhanced analysis
    };

    console.log(`✅ Claude brand analysis completed successfully`);

    return NextResponse.json({
      success: true,
      data: brandAnalysis,
      metadata: {
        analysisType: 'claude-enhanced',
        timestamp: brandAnalysis.analysisTimestamp,
        dataCompleteness: brandAnalysis.dataCompleteness,
        url: websiteUrl
      }
    });

  } catch (error) {
    console.error('❌ [analyze-brand-claude] Caught error:', error);
    console.error('❌ [analyze-brand-claude] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [analyze-brand-claude] Error message:', errorMessage);
    
    // Handle specific error types
    if (errorMessage.includes('Failed to extract')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to extract sufficient data from the website. The site may have limited content or be protected.',
          errorType: 'extraction_failed'
        },
        { status: 422 }
      );
    }

    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to connect to the website. Please check the URL and try again.',
          errorType: 'network_error'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to analyze brand: ${errorMessage}`,
        errorType: 'analysis_error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const websiteUrl = searchParams.get('url');
  const businessType = searchParams.get('type');
  const includeCompetitorAnalysis = searchParams.get('competitor') === 'true';

  if (!websiteUrl) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Convert GET to POST format
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ 
      websiteUrl, 
      businessType, 
      includeCompetitorAnalysis 
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  return POST(postRequest);
}
