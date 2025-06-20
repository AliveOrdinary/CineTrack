/**
 * TypeScript types for the Review Response Prompts System
 */

export type ReviewPromptCategory = 'plot' | 'characters' | 'technical' | 'emotional' | 'recommendation';

// Base review prompt interface from database
export interface ReviewPrompt {
  id: string;
  category: ReviewPromptCategory;
  prompt_text: string;
  placeholder_text?: string;
  is_active: boolean;
  sort_order: number;
  media_type: 'movie' | 'tv' | 'both';
  created_at: string;
  updated_at: string;
}

// Review response interface from database
export interface ReviewResponse {
  id: string;
  review_id: string;
  prompt_id: string;
  response_text: string;
  created_at: string;
  updated_at: string;
}

// Review response with prompt information
export interface ReviewResponseWithPrompt extends ReviewResponse {
  prompt: ReviewPrompt;
}

// Input type for creating review responses
export interface CreateReviewResponseInput {
  review_id: string;
  prompt_id: string;
  response_text: string;
}

// Input type for updating review responses
export interface UpdateReviewResponseInput {
  response_text: string;
}

// Grouped prompts by category
export interface ReviewPromptsGroup {
  category: ReviewPromptCategory;
  media_type: 'movie' | 'tv' | 'both';
  prompt_count: number;
  prompts: Array<{
    id: string;
    prompt_text: string;
    placeholder_text?: string;
    sort_order: number;
  }>;
}

// Review with prompt responses
export interface ReviewWithResponses {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  content: string;
  rating?: number;
  is_spoiler?: boolean;
  is_anonymous?: boolean;
  likes_count?: number;
  comments_count?: number;
  visibility?: 'public' | 'followers' | 'private';
  watched_content_id?: string;
  created_at: string;
  updated_at: string;
  prompt_responses: Array<{
    prompt_id: string;
    prompt_text: string;
    prompt_category: ReviewPromptCategory;
    response_text: string;
    response_created_at: string;
  }>;
}

// Form state for review creation with prompts
export interface ReviewFormWithPrompts {
  content: string;
  rating?: number;
  is_spoiler: boolean;
  is_anonymous: boolean;
  visibility: 'public' | 'followers' | 'private';
  responses: Record<string, string>; // prompt_id -> response_text
}

// Prompt category configurations
export const REVIEW_PROMPT_CATEGORIES: Record<ReviewPromptCategory, {
  label: string;
  icon: string;
  description: string;
  color: string;
}> = {
  plot: {
    label: 'Plot & Story',
    icon: '📖',
    description: 'Questions about the story, pacing, and narrative structure',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  characters: {
    label: 'Characters',
    icon: '👥',
    description: 'Questions about character development and performances',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  technical: {
    label: 'Technical Aspects',
    icon: '🎬',
    description: 'Questions about production quality, visuals, and audio',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  emotional: {
    label: 'Emotional Impact',
    icon: '💭',
    description: 'Questions about personal reactions and emotional responses',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  },
  recommendation: {
    label: 'Recommendations',
    icon: '👍',
    description: 'Questions about who would enjoy this and similar content',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }
};

// Review statistics with prompt usage
export interface ReviewPromptsStats {
  total_prompts: number;
  active_prompts: number;
  prompts_by_category: Record<ReviewPromptCategory, number>;
  total_responses: number;
  average_responses_per_review: number;
  most_used_prompts: Array<{
    prompt_id: string;
    prompt_text: string;
    usage_count: number;
  }>;
}

// Utility functions
export function getPromptCategoryConfig(category: ReviewPromptCategory) {
  return REVIEW_PROMPT_CATEGORIES[category];
}

export function filterPromptsForMediaType(
  prompts: ReviewPrompt[],
  mediaType: 'movie' | 'tv'
): ReviewPrompt[] {
  return prompts.filter(prompt => 
    prompt.media_type === 'both' || prompt.media_type === mediaType
  );
}

export function groupPromptsByCategory(prompts: ReviewPrompt[]): Record<ReviewPromptCategory, ReviewPrompt[]> {
  return prompts.reduce((groups, prompt) => {
    if (!groups[prompt.category]) {
      groups[prompt.category] = [];
    }
    groups[prompt.category].push(prompt);
    return groups;
  }, {} as Record<ReviewPromptCategory, ReviewPrompt[]>);
}

export function sortPromptsByOrder(prompts: ReviewPrompt[]): ReviewPrompt[] {
  return [...prompts].sort((a, b) => a.sort_order - b.sort_order);
}

export function validatePromptResponse(response: string): {
  isValid: boolean;
  error?: string;
} {
  if (!response.trim()) {
    return { isValid: false, error: 'Response cannot be empty' };
  }
  
  if (response.length < 10) {
    return { isValid: false, error: 'Response should be at least 10 characters long' };
  }
  
  if (response.length > 1000) {
    return { isValid: false, error: 'Response should be no more than 1000 characters' };
  }
  
  return { isValid: true };
}

export function calculateReviewCompleteness(
  availablePrompts: ReviewPrompt[],
  responses: Record<string, string>
): {
  completed: number;
  total: number;
  percentage: number;
  missingCategories: ReviewPromptCategory[];
} {
  const completedPrompts = Object.keys(responses).filter(promptId => 
    responses[promptId]?.trim().length > 0
  );
  
  const total = availablePrompts.length;
  const completed = completedPrompts.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const answeredCategories = new Set(
    availablePrompts
      .filter(prompt => responses[prompt.id]?.trim().length > 0)
      .map(prompt => prompt.category)
  );
  
  const allCategories = new Set(availablePrompts.map(prompt => prompt.category));
  const missingCategories = Array.from(allCategories).filter(
    category => !answeredCategories.has(category)
  ) as ReviewPromptCategory[];
  
  return {
    completed,
    total,
    percentage,
    missingCategories
  };
}

export function formatPromptResponse(response: string, maxLength: number = 150): string {
  if (response.length <= maxLength) {
    return response;
  }
  
  const truncated = response.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

export function getPromptResponsePreview(
  responses: Array<{
    prompt_text: string;
    prompt_category: ReviewPromptCategory;
    response_text: string;
  }>,
  maxResponses: number = 3
): string {
  if (responses.length === 0) {
    return 'No detailed responses provided.';
  }
  
  const previews = responses
    .slice(0, maxResponses)
    .map(response => {
      const category = getPromptCategoryConfig(response.prompt_category);
      const preview = formatPromptResponse(response.response_text, 100);
      return `${category.icon} ${preview}`;
    });
  
  const remainingCount = Math.max(0, responses.length - maxResponses);
  
  if (remainingCount > 0) {
    previews.push(`...and ${remainingCount} more response${remainingCount !== 1 ? 's' : ''}`);
  }
  
  return previews.join('\n\n');
}