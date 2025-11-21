import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, ecommerceContext, businessType } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json({
        error: 'Website URL is required'
      }, { status: 400 });
    }

    console.log('🛒 Starting E-commerce brand analysis for:', websiteUrl);
    console.log('📦 E-commerce context:', {
      platform: ecommerceContext?.platform,
      totalProducts: ecommerceContext?.totalProducts,
      productsCount: ecommerceContext?.products?.length || 0
    });

    // Use the existing working Claude analysis endpoint
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment 
      ? 'http://localhost:3001' 
      : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001');
    
    const apiUrl = `${baseUrl}/api/analyze-website-claude`;
    console.log('📡 Calling existing Claude API:', apiUrl);

    // Call the proven Claude analysis endpoint
    const analysisResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteUrl: websiteUrl,
        analysisType: 'products' // E-commerce stores are product-focused
      })
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('❌ Claude analysis failed:', {
        status: analysisResponse.status,
        statusText: analysisResponse.statusText,
        body: errorText
      });
      
      return NextResponse.json({
        error: `Claude analysis failed: ${errorText}`
      }, { status: analysisResponse.status });
    }

    const analysisResult = await analysisResponse.json();
    
    if (!analysisResult.success) {
      return NextResponse.json({
        error: analysisResult.error || 'Claude analysis failed'
      }, { status: 400 });
    }

    // Transform the result to match expected format
    const rawData = analysisResult.data;

    // Extract key features from product categories (unique categories only)
    let keyFeatures = '';
    if (rawData.products && Array.isArray(rawData.products) && rawData.products.length > 0) {
      const categories = [...new Set(
        rawData.products
          .map((p: any) => p.category)
          .filter((cat: any) => cat && typeof cat === 'string' && cat.trim() !== '')
      )];
      if (categories.length > 0) {
        keyFeatures = categories.join('\n');
      }
    } else if (rawData.services && Array.isArray(rawData.services) && rawData.services.length > 0) {
      // Extract service names and features
      const serviceFeatures: string[] = [];
      rawData.services.forEach((svc: any) => {
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
      const storeInfo = rawData.store_info || {};
      const companyInfo = rawData.company_info || {};

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
        : 'Wide range of products\nQuality electronics\nCompetitive pricing';
    }

    // Extract competitive advantages from multiple sources
    const competitiveAdvantagesList: string[] = [];
    const storeInfo = rawData.store_info || {};
    const companyInfo = rawData.company_info || {};

    // From specialties (these are often competitive advantages)
    if (storeInfo.specialties && Array.isArray(storeInfo.specialties) && storeInfo.specialties.length > 0) {
      const validSpecialties = storeInfo.specialties.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
      competitiveAdvantagesList.push(...validSpecialties);
    } else if (companyInfo.specialties && Array.isArray(companyInfo.specialties) && companyInfo.specialties.length > 0) {
      const validSpecialties = companyInfo.specialties.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
      competitiveAdvantagesList.push(...validSpecialties);
    }

    // From services offered (like delivery, warranty, etc.)
    if (rawData.services_offered && Array.isArray(rawData.services_offered) && rawData.services_offered.length > 0) {
      const validServices = rawData.services_offered.filter((s: any) => s && typeof s === 'string' && s.trim() !== '');
      competitiveAdvantagesList.push(...validServices);
    }

    // From payment options (e.g., "Lipa Polepole available")
    if (rawData.payment_options && Array.isArray(rawData.payment_options) && rawData.payment_options.length > 0) {
      const validPayments = rawData.payment_options.filter((p: any) => p && typeof p === 'string' && p.trim() !== '');
      competitiveAdvantagesList.push(...validPayments);
    }

    // From delivery info
    if (rawData.delivery_info && rawData.delivery_info.methods && Array.isArray(rawData.delivery_info.methods) && rawData.delivery_info.methods.length > 0) {
      competitiveAdvantagesList.push('Delivery available');
      if (rawData.delivery_info.coverage && typeof rawData.delivery_info.coverage === 'string' && rawData.delivery_info.coverage.trim() !== '') {
        competitiveAdvantagesList.push(`Coverage: ${rawData.delivery_info.coverage}`);
      }
    }

    // From certifications
    if (companyInfo.certifications && Array.isArray(companyInfo.certifications) && companyInfo.certifications.length > 0) {
      const validCerts = companyInfo.certifications.filter((c: any) => c && typeof c === 'string' && c.trim() !== '');
      competitiveAdvantagesList.push(...validCerts);
    }

    // From service benefits (extract unique benefits across all services)
    if (rawData.services && Array.isArray(rawData.services) && rawData.services.length > 0) {
      const allBenefits: string[] = [];
      rawData.services.forEach((svc: any) => {
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
      : 'Flexible payment options\nWide product selection\nCompetitive pricing\nReliable delivery\nQuality products';

    console.log('🔍 [analyze-ecommerce-brand] Extracted data:');
    console.log(`  - Key Features: ${keyFeatures.split('\n').filter(f => f.trim()).length} items`);
    console.log(`  - Competitive Advantages: ${filteredAdvantages.length} items`);

    // Map Claude's response structure to expected format
    const data = {
      businessName: rawData.store_info?.name || rawData.company_info?.name,
      description: rawData.store_info?.detailed_description || rawData.company_info?.detailed_description,
      businessType: rawData.business_analysis?.business_type,
      industry: rawData.business_analysis?.industry,
      targetMarket: rawData.business_analysis?.target_market,
      businessModel: rawData.business_analysis?.business_model,
      location: rawData.store_info?.location || rawData.company_info?.location,
      services: rawData.services_offered || rawData.services,
      products: rawData.products,
      paymentOptions: rawData.payment_options,
      deliveryInfo: rawData.delivery_info,
      contactInfo: rawData.contact_info,
      visualStyle: rawData.visual_style,
      writingTone: rawData.writing_tone,
      // Add the extracted fields
      keyFeatures: keyFeatures,
      competitiveAdvantages: competitiveAdvantages,
      // Keep original data for reference
      _rawData: rawData
    };
    
    console.log('✅ E-commerce brand analysis complete:', {
      businessName: data.businessName,
      description: data.description?.substring(0, 100) + '...',
      services: Array.isArray(data.services) ? data.services.length : 0,
      products: Array.isArray(data.products) ? data.products.length : 0,
      keyFeatures: data.keyFeatures?.split('\n').length + ' items',
      competitiveAdvantages: data.competitiveAdvantages?.split('\n').length + ' items'
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ E-commerce brand analysis API error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'E-commerce analysis failed'
    }, { status: 500 });
  }
}
