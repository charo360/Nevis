/**
 * Text-Based Image Editing System
 * Allows users to edit generated designs using natural language commands
 * 
 * Supported commands:
 * - "Change [this word] to [that word]"
 * - "Remove [this element]"
 * - "Replace [this text] with [new text]"
 * - "Make [element] bigger/smaller"
 * - "Change color of [element] to [color]"
 */

import { BrandProfile } from '@/lib/types';
import { AdvancedCommandParser, ParsedCommand, CommandParsingResult } from './command-parser';

export interface EditCommand {
  type: 'replace_text' | 'remove_element' | 'change_color' | 'resize_element' | 'add_text' | 'move_element';
  target: string;
  replacement?: string;
  color?: string;
  size?: 'bigger' | 'smaller' | number;
  position?: { x: number; y: number };
  confidence?: number;
}

export interface ImageEditRequest {
  originalImageUrl: string;
  command: string;
  brandProfile?: BrandProfile;
  platform?: string;
  preserveStyle?: boolean;
}

export interface ImageEditResult {
  success: boolean;
  editedImageUrl?: string;
  appliedEdits: EditCommand[];
  processingTime: number;
  error?: string;
  explanation?: string;
  suggestions?: string[];
  warnings?: string[];
  commandParsingResult?: CommandParsingResult;
}

/**
 * Main class for text-based image editing
 */
export class TextBasedImageEditor {
  
  /**
   * Parse natural language command into structured edit commands
   * Now uses advanced NLP-like parsing for better accuracy
   */
  static parseEditCommand(command: string): { commands: EditCommand[]; parsingResult: CommandParsingResult } {
    // Use advanced command parser
    const parsingResult = AdvancedCommandParser.parseCommand(command);

    // Convert ParsedCommand to EditCommand format
    const commands: EditCommand[] = parsingResult.commands.map(cmd => ({
      type: cmd.type,
      target: cmd.target,
      replacement: cmd.replacement,
      color: cmd.color,
      size: cmd.size,
      confidence: cmd.confidence,
      position: cmd.position ? { x: 0, y: 0 } : undefined // Convert position format
    }));

    return { commands, parsingResult };

    // This method is now deprecated in favor of the advanced parser
    // Keeping for backward compatibility
    return this.parseEditCommand(command).commands;
  }

  /**
   * Apply text-based edits to an image
   */
  static async applyTextEdits(request: ImageEditRequest): Promise<ImageEditResult> {
    const startTime = Date.now();

    try {
      // Parse the command using advanced parser
      const { commands: editCommands, parsingResult } = this.parseEditCommand(request.command);

      // Validate parsed commands
      const validation = AdvancedCommandParser.validateCommands(
        parsingResult.commands
      );

      if (!validation.valid) {
        return {
          success: false,
          appliedEdits: [],
          processingTime: Date.now() - startTime,
          error: validation.errors.join('; '),
          suggestions: parsingResult.suggestions,
          warnings: parsingResult.warnings,
          commandParsingResult: parsingResult
        };
      }

      if (editCommands.length === 0) {
        return {
          success: false,
          appliedEdits: [],
          processingTime: Date.now() - startTime,
          error: 'Could not understand the edit command. Please try commands like "Change [text] to [new text]" or "Remove [element]"',
          suggestions: parsingResult.suggestions,
          commandParsingResult: parsingResult
        };
      }

      // Generate new image with edits applied
      const editedImageUrl = await this.generateEditedImage(
        request.originalImageUrl,
        editCommands,
        request.brandProfile,
        request.platform,
        request.preserveStyle
      );

      return {
        success: true,
        editedImageUrl,
        appliedEdits: editCommands,
        processingTime: Date.now() - startTime,
        explanation: this.generateEditExplanation(editCommands),
        suggestions: parsingResult.suggestions,
        warnings: parsingResult.warnings,
        commandParsingResult: parsingResult
      };

    } catch (error) {
      return {
        success: false,
        appliedEdits: [],
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred during editing'
      };
    }
  }

  /**
   * Generate edited image using AI
   */
  private static async generateEditedImage(
    originalImageUrl: string,
    editCommands: EditCommand[],
    brandProfile?: BrandProfile,
    platform?: string,
    preserveStyle: boolean = true
  ): Promise<string> {
    
    // Build editing prompt for AI
    const editingPrompt = this.buildEditingPrompt(editCommands, brandProfile, platform, preserveStyle);
    
    try {
      // Use the creative asset generation system with the original image as reference
      const { generateCreativeAsset } = await import('@/ai/flows/generate-creative-asset');
      
      const result = await generateCreativeAsset({
        prompt: editingPrompt,
        outputType: 'image',
        referenceAssetUrl: originalImageUrl,
        useBrandProfile: !!brandProfile,
        brandProfile: brandProfile || null,
        maskDataUrl: null,
        preferredModel: 'gemini-2.5-flash-image-preview'
      });

      if (!result.imageUrl) {
        throw new Error('Failed to generate edited image');
      }

      return result.imageUrl;
      
    } catch (error) {
      console.error('Error generating edited image:', error);
      throw new Error('Failed to apply edits to image');
    }
  }

  /**
   * Build AI prompt for image editing
   */
  private static buildEditingPrompt(
    editCommands: EditCommand[],
    brandProfile?: BrandProfile,
    platform?: string,
    preserveStyle: boolean = true
  ): string {
    let prompt = `Edit the provided image according to these specific instructions:\n\n`;

    // Add edit instructions
    editCommands.forEach((command, index) => {
      prompt += `${index + 1}. `;
      
      switch (command.type) {
        case 'replace_text':
          prompt += `Replace the text "${command.target}" with "${command.replacement}"`;
          break;
        case 'remove_element':
          prompt += `Remove the element: "${command.target}"`;
          break;
        case 'change_color':
          prompt += `Change the color of "${command.target}" to ${command.color}`;
          break;
        case 'resize_element':
          prompt += `Make "${command.target}" ${command.size}`;
          break;
        case 'add_text':
          prompt += `Add the text: "${command.target}"`;
          break;
        case 'move_element':
          prompt += `Move "${command.target}" to a different position`;
          break;
      }
      prompt += '\n';
    });

    // Add style preservation instructions
    if (preserveStyle) {
      prompt += `\nIMPORTANT: Maintain the original design style, layout, colors, and overall aesthetic. Only make the specific changes requested above.`;
    }

    // Add brand consistency if available
    if (brandProfile) {
      prompt += `\n\nBrand Guidelines:`;
      if (brandProfile.primaryColor) {
        prompt += `\n- Primary Color: ${brandProfile.primaryColor}`;
      }
      if (brandProfile.accentColor) {
        prompt += `\n- Accent Color: ${brandProfile.accentColor}`;
      }
      if (brandProfile.businessName) {
        prompt += `\n- Business Name: ${brandProfile.businessName}`;
      }
    }

    // Add platform-specific requirements
    if (platform) {
      prompt += `\n\nPlatform: ${platform} - ensure the edited image maintains proper dimensions and quality for this platform.`;
    }

    prompt += `\n\nGenerate a high-quality edited image that implements these changes while preserving the professional appearance of the original design.`;

    return prompt;
  }

  /**
   * Generate human-readable explanation of applied edits
   */
  private static generateEditExplanation(editCommands: EditCommand[]): string {
    if (editCommands.length === 0) {
      return 'No edits were applied.';
    }

    const explanations = editCommands.map(command => {
      switch (command.type) {
        case 'replace_text':
          return `Replaced "${command.target}" with "${command.replacement}"`;
        case 'remove_element':
          return `Removed "${command.target}"`;
        case 'change_color':
          return `Changed color of "${command.target}" to ${command.color}`;
        case 'resize_element':
          return `Made "${command.target}" ${command.size}`;
        case 'add_text':
          return `Added text: "${command.target}"`;
        case 'move_element':
          return `Moved "${command.target}"`;
        default:
          return `Applied edit to "${command.target}"`;
      }
    });

    return explanations.join(', ');
  }

  /**
   * Validate edit command before processing
   */
  static validateEditCommand(command: string): { valid: boolean; error?: string } {
    if (!command || command.trim().length === 0) {
      return { valid: false, error: 'Edit command cannot be empty' };
    }

    if (command.length > 500) {
      return { valid: false, error: 'Edit command is too long. Please keep it under 500 characters.' };
    }

    // Check for potentially harmful commands
    const harmfulPatterns = [
      /delete\s+all/i,
      /remove\s+everything/i,
      /clear\s+image/i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(command)) {
        return { valid: false, error: 'This command would remove too much content. Please be more specific.' };
      }
    }

    return { valid: true };
  }
}
