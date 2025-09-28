/**
 * Type definitions for tone management system
 * Provides comprehensive interfaces for tone data, operations, and state management
 */

/**
 * Tone category for organization
 */
export type ToneCategory =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'formal'
  | 'humorous'
  | 'persuasive'
  | 'empathetic'
  | 'custom';

/**
 * Tone usage statistics
 */
export interface ToneUsageStats {
  readonly totalUses: number;
  readonly lastUsed?: Date;
  readonly successRate: number;
  readonly averageEngagement: number;
  readonly responseTime: number;
}

/**
 * Core tone interface
 */
export interface Tone {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly content: string;
  readonly category: ToneCategory;
  readonly isDefault: boolean;
  readonly isFavorite: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly tags: readonly string[];
  readonly stats: ToneUsageStats;
  readonly isActive: boolean;
}

/**
 * Tone creation/edit form data
 */
export interface ToneFormData {
  readonly name: string;
  readonly description: string;
  readonly content: string;
  readonly category: ToneCategory;
  readonly tags: readonly string[];
  readonly isActive: boolean;
}

/**
 * Tone validation result
 */
export interface ToneValidationResult {
  readonly isValid: boolean;
  readonly errors: Record<string, string>;
  readonly warnings: Record<string, string>;
}

/**
 * Tone search and filter criteria
 */
export interface ToneSearchCriteria {
  readonly query?: string;
  readonly category?: ToneCategory;
  readonly tags?: readonly string[];
  readonly isFavorite?: boolean;
  readonly isActive?: boolean;
  readonly sortBy?: 'name' | 'createdAt' | 'lastUsed' | 'usage' | 'engagement';
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Tone list view options
 */
export interface ToneListOptions {
  readonly viewMode: 'grid' | 'list';
  readonly itemsPerPage: number;
  readonly showStats: boolean;
  readonly showPreview: boolean;
}

/**
 * Tone editor state
 */
export interface ToneEditorState {
  readonly mode: 'create' | 'edit' | 'duplicate';
  readonly originalTone?: Tone;
  readonly formData: ToneFormData;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly isSaving: boolean;
  readonly lastSaved?: Date;
  readonly validationResult?: ToneValidationResult;
}

/**
 * Tone preview configuration
 */
export interface TonePreviewConfig {
  readonly sampleText: string;
  readonly targetPlatform: 'twitter' | 'linkedin' | 'reddit' | 'generic';
  readonly showMetrics: boolean;
  readonly showComparison: boolean;
}

/**
 * Tone effectiveness metrics
 */
export interface ToneEffectivenessMetrics {
  readonly clarity: number;
  readonly engagement: number;
  readonly appropriateness: number;
  readonly uniqueness: number;
  readonly overallScore: number;
}

/**
 * Bulk tone operations
 */
export interface ToneBulkOperation {
  readonly operation:
    | 'delete'
    | 'favorite'
    | 'unfavorite'
    | 'activate'
    | 'deactivate'
    | 'tag'
    | 'category';
  readonly toneIds: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Tone API operations (mock interfaces for Task D3 integration)
 */
export interface ToneApiOperations {
  readonly list: (criteria?: ToneSearchCriteria) => Promise<readonly Tone[]>;
  readonly get: (id: string) => Promise<Tone>;
  readonly create: (data: ToneFormData) => Promise<Tone>;
  readonly update: (id: string, data: Partial<ToneFormData>) => Promise<Tone>;
  readonly delete: (id: string) => Promise<void>;
  readonly bulk: (operation: ToneBulkOperation) => Promise<readonly Tone[]>;
  readonly validate: (data: ToneFormData) => Promise<ToneValidationResult>;
  readonly preview: (tone: Tone, config: TonePreviewConfig) => Promise<string>;
  readonly analyze: (content: string) => Promise<ToneEffectivenessMetrics>;
}

/**
 * Tone management loading states
 */
export type ToneLoadingState =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'deleting'
  | 'validating'
  | 'previewing'
  | 'success'
  | 'error';

/**
 * Tone management error types
 */
export interface ToneError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly retry?: () => void;
}

/**
 * Default tone categories with metadata
 */
export const toneCategories: Record<
  ToneCategory,
  {
    readonly label: string;
    readonly description: string;
    readonly color: string;
  }
> = {
  professional: {
    label: 'Professional',
    description: 'Formal business communication style',
    color: '#3B82F6',
  },
  casual: {
    label: 'Casual',
    description: 'Relaxed and informal tone',
    color: '#10B981',
  },
  friendly: {
    label: 'Friendly',
    description: 'Warm and approachable communication',
    color: '#F59E0B',
  },
  formal: {
    label: 'Formal',
    description: 'Structured and official tone',
    color: '#6366F1',
  },
  humorous: {
    label: 'Humorous',
    description: 'Light-hearted and entertaining',
    color: '#EC4899',
  },
  persuasive: {
    label: 'Persuasive',
    description: 'Convincing and influential style',
    color: '#EF4444',
  },
  empathetic: {
    label: 'Empathetic',
    description: 'Understanding and compassionate',
    color: '#8B5CF6',
  },
  custom: {
    label: 'Custom',
    description: 'User-defined tone style',
    color: '#64748B',
  },
} as const;

/**
 * Default sample texts for tone preview
 */
export const sampleTexts: Record<string, string> = {
  twitter:
    "Just discovered an amazing new tool that's completely changed how I approach my work. Can't believe I waited so long to try it!",
  linkedin:
    'Excited to share insights from our latest project. The results demonstrate the power of collaborative innovation in driving business transformation.',
  reddit:
    "Has anyone else experienced this issue? I've been trying to solve it for hours and could really use some advice from the community.",
  generic:
    'Thank you for reaching out about this opportunity. I appreciate you thinking of me and would love to discuss the details further.',
} as const;

/**
 * Mock tone data for development and demonstration
 */
export const mockTones: readonly Tone[] = [
  {
    id: '1',
    name: 'Professional',
    description: 'Clear, concise business communication',
    content:
      'Maintain a professional tone with clear structure, appropriate formality, and focus on business outcomes.',
    category: 'professional',
    isDefault: true,
    isFavorite: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'system',
    tags: ['business', 'formal', 'clear'],
    stats: {
      totalUses: 145,
      lastUsed: new Date('2024-03-10'),
      successRate: 92,
      averageEngagement: 78,
      responseTime: 1.2,
    },
    isActive: true,
  },
  {
    id: '2',
    name: 'Friendly',
    description: 'Warm and approachable communication',
    content:
      'Use a warm, welcoming tone that makes people feel comfortable and valued. Include personal touches and empathy.',
    category: 'friendly',
    isDefault: true,
    isFavorite: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-05'),
    createdBy: 'system',
    tags: ['warm', 'personal', 'empathy'],
    stats: {
      totalUses: 89,
      lastUsed: new Date('2024-03-12'),
      successRate: 88,
      averageEngagement: 85,
      responseTime: 1.5,
    },
    isActive: true,
  },
  {
    id: '3',
    name: 'Casual',
    description: 'Relaxed and conversational style',
    content:
      'Keep it casual and conversational. Use everyday language, contractions, and a relaxed approach.',
    category: 'casual',
    isDefault: false,
    isFavorite: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    createdBy: 'user123',
    tags: ['relaxed', 'conversational', 'informal'],
    stats: {
      totalUses: 67,
      lastUsed: new Date('2024-03-08'),
      successRate: 85,
      averageEngagement: 82,
      responseTime: 1.8,
    },
    isActive: true,
  },
  {
    id: '4',
    name: 'Persuasive',
    description: 'Compelling and influential communication',
    content:
      'Focus on benefits, use persuasive language, include social proof, and create urgency when appropriate.',
    category: 'persuasive',
    isDefault: false,
    isFavorite: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-25'),
    createdBy: 'user456',
    tags: ['compelling', 'benefits', 'urgency'],
    stats: {
      totalUses: 34,
      lastUsed: new Date('2024-03-05'),
      successRate: 91,
      averageEngagement: 76,
      responseTime: 2.1,
    },
    isActive: true,
  },
  {
    id: '5',
    name: 'Technical',
    description: 'Detailed technical communication',
    content:
      'Provide accurate technical information with appropriate detail level. Use precise terminology and clear explanations.',
    category: 'formal',
    isDefault: false,
    isFavorite: false,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-01'),
    createdBy: 'user789',
    tags: ['technical', 'detailed', 'precise'],
    stats: {
      totalUses: 23,
      lastUsed: new Date('2024-03-11'),
      successRate: 94,
      averageEngagement: 71,
      responseTime: 2.8,
    },
    isActive: false,
  },
] as const;
