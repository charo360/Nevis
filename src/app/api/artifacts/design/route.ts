/**
 * API endpoint for design-specific artifacts
 * Handles design examples, templates, and design-related operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { artifactsService } from '@/lib/services/artifacts-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const platform = searchParams.get('platform');
    const businessType = searchParams.get('businessType');

    switch (action) {
      case 'list':
        // Get design-related artifacts
        const allArtifacts = artifactsService.getAllArtifacts();

        // Filter for design-related artifacts
        const filteredArtifacts = allArtifacts.filter(artifact =>
          (artifact.type === 'image' ||
            artifact.type === 'template' ||
            artifact.type === 'reference') &&
          artifact.isActive
        );

        return NextResponse.json({
          success: true,
          artifacts: filteredArtifacts,
          count: filteredArtifacts.length
        });

      case 'examples':
        // Get design examples for specific platform/business type
        const examples = artifactsService.getAllArtifacts().filter(a =>
          a.category === 'references' && a.isActive
        );

        // Filter by platform and business type if provided
        let filteredExamples = examples;
        if (platform || businessType) {
          filteredExamples = examples.filter(artifact => {
            const matchesPlatform = !platform ||
              artifact.tags?.includes(platform.toLowerCase()) ||
              artifact.metadata?.platform === platform;

            const matchesBusinessType = !businessType ||
              artifact.tags?.includes(businessType.toLowerCase()) ||
              artifact.metadata?.businessType === businessType;

            return matchesPlatform && matchesBusinessType;
          });
        }

        return NextResponse.json({
          success: true,
          examples: filteredExamples,
          platform,
          businessType,
          count: filteredExamples.length
        });

      case 'templates':
        // Get design templates
        const templates = artifactsService.getAllArtifacts().filter(a =>
          a.category === 'templates' && a.isActive
        );

        return NextResponse.json({
          success: true,
          templates,
          count: templates.length
        });

      case 'active-design':
        // Get currently active design artifacts
        const activeDesignArtifacts = artifactsService.getActiveArtifacts();
        const designOnly = activeDesignArtifacts.filter(artifact =>
          artifact.category === 'references' ||
          artifact.category === 'templates' ||
          artifact.type === 'image'
        );

        return NextResponse.json({
          success: true,
          artifacts: designOnly,
          count: designOnly.length
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported: list, examples, templates, active-design'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Design artifacts API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;

    switch (action) {
      case 'upload-design':
        const files = formData.getAll('files') as File[];
        const platform = formData.get('platform') as string;
        const businessType = formData.get('businessType') as string;
        const designType = formData.get('designType') as string; // 'example', 'template', 'reference'
        const customName = formData.get('customName') as string;
        const instructions = formData.get('instructions') as string;

        if (!files || files.length === 0) {
          return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
        }

        // Determine category based on design type
        let category: any = 'references';
        if (designType === 'template') category = 'templates';
        if (designType === 'example') category = 'references';

        const uploadedDesigns = await artifactsService.uploadArtifacts(files, category, {
          uploadType: 'design',
          usageType: 'reference',
          isActive: true,
          customName,
          instructions
        });

        // Add design-specific tags
        for (const artifact of uploadedDesigns) {
          const tags = artifact.tags || [];
          if (platform) tags.push(platform.toLowerCase());
          if (businessType) tags.push(businessType.toLowerCase());
          if (designType) tags.push(designType.toLowerCase());

          await artifactsService.updateArtifact(artifact.id, {
            tags,
            metadata: {
              ...artifact.metadata,
              platform,
              businessType,
              designType
            }
          });
        }

        return NextResponse.json({ success: true, artifacts: uploadedDesigns });

      case 'analyze-design':
        const analysisFile = formData.get('file') as File;
        if (!analysisFile) {
          return NextResponse.json({ success: false, error: 'File required for analysis' }, { status: 400 });
        }

        // For now, return mock analysis - in production, use AI vision APIs
        const mockAnalysis = {
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
          style: 'modern',
          layout: 'asymmetrical',
          elements: ['text', 'images', 'shapes'],
          mood: 'professional',
          quality: 8.5
        };

        return NextResponse.json({ success: true, analysis: mockAnalysis });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported: upload-design, analyze-design'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Design artifacts upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
