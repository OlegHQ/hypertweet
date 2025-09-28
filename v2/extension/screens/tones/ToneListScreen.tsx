/**
 * ToneListScreen component for managing and viewing tone collections
 * Features search, filter, sort, bulk actions, and responsive grid/list views
 */

import React, { useState, useMemo, useCallback, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { PageContainer } from '../../components/layout/PageContainer';
import type { LoadingState, LayoutError } from '../../components/layout/types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { ToneCard } from './components/ToneCard';
import { TonePreview } from './components/TonePreview';
import {
  type Tone,
  type ToneSearchCriteria,
  type ToneListOptions,
  type ToneCategory,
  type ToneBulkOperation,
  mockTones,
  toneCategories,
} from './types';

/**
 * Tone list screen props interface
 */
export interface ToneListScreenProps {
  readonly tones?: readonly Tone[];
  readonly loading?: LoadingState;
  readonly error?: LayoutError;
  readonly onCreateTone?: () => void;
  readonly onEditTone?: (tone: Tone) => void;
  readonly onDeleteTone?: (tone: Tone) => void;
  readonly onBulkAction?: (operation: ToneBulkOperation) => void;
  readonly onToggleFavorite?: (tone: Tone) => void;
  readonly onRefresh?: () => void;
  readonly className?: string;
}

/**
 * Toolbar container styles
 */
const toolbarStyles = (theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
  padding: ${theme.spacing[4]};
  background-color: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border.primary};
`;

/**
 * Toolbar row styles
 */
const toolbarRowStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[4]};

  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing[3]};
  }
`;

/**
 * Search and filter section styles
 */
const searchSectionStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  flex: 1;

  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * View controls styles
 */
const viewControlsStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};

  @media (max-width: ${theme.breakpoints.md}) {
    justify-content: space-between;
  }
`;

/**
 * Filter group styles
 */
const filterGroupStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};

  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * View toggle styles
 */
const viewToggleStyles = (theme: ThemeType) => css`
  display: flex;
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
  border: 1px solid ${theme.colors.border.primary};
`;

/**
 * View toggle button styles
 */
const viewToggleButtonStyles = (theme: ThemeType, isActive: boolean) => css`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  background-color: ${isActive
    ? theme.colors.interactive.primary
    : theme.colors.background.primary};
  color: ${isActive ? theme.colors.text.inverse : theme.colors.text.secondary};
  border: none;
  cursor: pointer;
  font-size: ${theme.typography.fontSize.sm};
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${isActive
      ? theme.colors.interactive.primaryHover
      : theme.colors.background.secondary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Bulk actions bar styles
 */
const bulkActionsStyles = (theme: ThemeType, isVisible: boolean) => css`
  display: ${isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  background-color: ${theme.colors.interactive.primary}10;
  border: 1px solid ${theme.colors.interactive.primary}40;
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing[4]};
`;

/**
 * Bulk info styles
 */
const bulkInfoStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
`;

/**
 * Bulk actions group styles
 */
const bulkActionsGroupStyles = (theme: ThemeType) => css`
  display: flex;
  gap: ${theme.spacing[2]};
`;

/**
 * Grid container styles
 */
const gridContainerStyles = (
  theme: ThemeType,
  viewMode: 'grid' | 'list'
) => css`
  ${viewMode === 'grid' &&
  `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: ${theme.spacing[4]};
  `}

  ${viewMode === 'list' &&
  `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing[3]};
  `}

  @media (max-width: ${theme.breakpoints.md}) {
    ${viewMode === 'grid' &&
    `
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: ${theme.spacing[3]};
    `}
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    ${viewMode === 'grid' &&
    `
      grid-template-columns: 1fr;
    `}
  }
`;

/**
 * Empty state styles
 */
const emptyStateStyles = (theme: ThemeType) => css`
  text-align: center;
  padding: ${theme.spacing[12]} ${theme.spacing[6]};
  background-color: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.lg};
  border: 2px dashed ${theme.colors.border.primary};
`;

/**
 * Empty state icon styles
 */
const emptyIconStyles = (theme: ThemeType) => css`
  width: 64px;
  height: 64px;
  margin: 0 auto ${theme.spacing[4]};
  color: ${theme.colors.text.tertiary};
`;

/**
 * Empty state title styles
 */
const emptyTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[2]} 0;
`;

/**
 * Empty state description styles
 */
const emptyDescriptionStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.secondary};
  margin: 0 0 ${theme.spacing[6]} 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`;

/**
 * Stats summary styles
 */
const statsSummaryStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing[4]};

  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing[2]};
  }
`;

/**
 * Sort select styles
 */
const sortSelectStyles = (theme: ThemeType) => css`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  background-color: ${theme.colors.background.primary};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Icon components
 */
const GridIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ListIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EmptyTonesIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

/**
 * Hook for managing tone list state
 */
const useToneListState = (initialTones: readonly Tone[] = mockTones) => {
  const [searchCriteria, setSearchCriteria] = useState<ToneSearchCriteria>({
    query: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [listOptions, setListOptions] = useState<ToneListOptions>({
    viewMode: 'grid',
    itemsPerPage: 50,
    showStats: true,
    showPreview: true,
  });
  const [selectedTones, setSelectedTones] = useState<Set<string>>(new Set());
  const [previewTone, setPreviewTone] = useState<Tone | null>(null);

  // Filter and sort tones
  const filteredTones = useMemo(() => {
    let filtered = [...initialTones];

    // Apply search filter
    if (searchCriteria.query) {
      const query = searchCriteria.query.toLowerCase();
      filtered = filtered.filter(
        tone =>
          tone.name.toLowerCase().includes(query) ||
          tone.description.toLowerCase().includes(query) ||
          tone.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (searchCriteria.category) {
      filtered = filtered.filter(
        tone => tone.category === searchCriteria.category
      );
    }

    // Apply favorite filter
    if (searchCriteria.isFavorite !== undefined) {
      filtered = filtered.filter(
        tone => tone.isFavorite === searchCriteria.isFavorite
      );
    }

    // Apply active filter
    if (searchCriteria.isActive !== undefined) {
      filtered = filtered.filter(
        tone => tone.isActive === searchCriteria.isActive
      );
    }

    // Apply sorting
    if (searchCriteria.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (searchCriteria.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'lastUsed': {
            const aLastUsed = a.stats.lastUsed?.getTime() ?? 0;
            const bLastUsed = b.stats.lastUsed?.getTime() ?? 0;
            comparison = aLastUsed - bLastUsed;
            break;
          }
          case 'usage':
            comparison = a.stats.totalUses - b.stats.totalUses;
            break;
          case 'engagement':
            comparison = a.stats.averageEngagement - b.stats.averageEngagement;
            break;
        }

        return searchCriteria.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [initialTones, searchCriteria]);

  return {
    searchCriteria,
    setSearchCriteria,
    listOptions,
    setListOptions,
    selectedTones,
    setSelectedTones,
    previewTone,
    setPreviewTone,
    filteredTones,
  };
};

/**
 * Tone list screen component with comprehensive tone management features
 */
export const ToneListScreen = forwardRef<HTMLDivElement, ToneListScreenProps>(
  (
    {
      tones = mockTones,
      loading = 'idle',
      error,
      onCreateTone,
      onEditTone,
      onDeleteTone,
      onBulkAction,
      onToggleFavorite,
      onRefresh,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const {
      searchCriteria,
      setSearchCriteria,
      listOptions,
      setListOptions,
      selectedTones,
      setSelectedTones,
      previewTone,
      setPreviewTone,
      filteredTones,
    } = useToneListState(tones);

    const isLoading = loading === 'loading';
    const hasSelectedTones = selectedTones.size > 0;

    // Event handlers
    const handleSearchChange = useCallback(
      (query: string) => {
        setSearchCriteria(prev => ({ ...prev, query }));
      },
      [setSearchCriteria]
    );

    const handleCategoryFilter = useCallback(
      (category: ToneCategory | '') => {
        setSearchCriteria(prev => ({
          ...prev,
          ...(category && { category }),
        }));
      },
      [setSearchCriteria]
    );

    const handleSortChange = useCallback(
      (sortBy: string) => {
        const [field, order] = sortBy.split('-');
        setSearchCriteria(prev => ({
          ...prev,
          ...(field && {
            sortBy: field as NonNullable<ToneSearchCriteria['sortBy']>,
          }),
          sortOrder: order as 'asc' | 'desc',
        }));
      },
      [setSearchCriteria]
    );

    const handleViewModeChange = useCallback(
      (viewMode: 'grid' | 'list') => {
        setListOptions(prev => ({ ...prev, viewMode }));
      },
      [setListOptions]
    );

    const handleToneSelect = useCallback(
      (tone: Tone, selected: boolean) => {
        setSelectedTones(prev => {
          const newSelected = new Set(prev);
          if (selected) {
            newSelected.add(tone.id);
          } else {
            newSelected.delete(tone.id);
          }
          return newSelected;
        });
      },
      [setSelectedTones]
    );

    const handleDeselectAll = useCallback(() => {
      setSelectedTones(new Set());
    }, [setSelectedTones]);

    const handleBulkDelete = useCallback(() => {
      if (onBulkAction) {
        onBulkAction({
          operation: 'delete',
          toneIds: Array.from(selectedTones),
        });
      }
      setSelectedTones(new Set());
    }, [onBulkAction, selectedTones, setSelectedTones]);

    const handleBulkFavorite = useCallback(() => {
      if (onBulkAction) {
        onBulkAction({
          operation: 'favorite',
          toneIds: Array.from(selectedTones),
        });
      }
      setSelectedTones(new Set());
    }, [onBulkAction, selectedTones, setSelectedTones]);

    // Calculate stats
    const totalTones = tones.length;
    const activeTones = tones.filter(tone => tone.isActive).length;
    const favoriteTones = tones.filter(tone => tone.isFavorite).length;

    return (
      <PageContainer
        ref={ref}
        title="Tone Management"
        description="Create, edit, and organize your AI response tones"
        loading={loading}
        {...(error && { error })}
        {...(className && { className })}
        maxWidth="xl"
        padding="lg"
      >
        {/* Toolbar */}
        <div css={toolbarStyles(theme)}>
          <div css={toolbarRowStyles(theme)}>
            <div css={searchSectionStyles(theme)}>
              <Input
                placeholder="Search tones..."
                value={searchCriteria.query}
                onChange={e => handleSearchChange(e.target.value)}
                disabled={isLoading}
              />

              <div css={filterGroupStyles(theme)}>
                <select
                  css={sortSelectStyles(theme)}
                  value={searchCriteria.category ?? ''}
                  onChange={e =>
                    handleCategoryFilter(e.target.value as ToneCategory)
                  }
                  disabled={isLoading}
                >
                  <option value="">All Categories</option>
                  {Object.entries(toneCategories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <select
                  css={sortSelectStyles(theme)}
                  value={`${searchCriteria.sortBy}-${searchCriteria.sortOrder}`}
                  onChange={e => handleSortChange(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="lastUsed-desc">Recently Used</option>
                  <option value="usage-desc">Most Used</option>
                  <option value="engagement-desc">Best Engagement</option>
                </select>
              </div>
            </div>

            <div css={viewControlsStyles(theme)}>
              <div css={viewToggleStyles(theme)}>
                <button
                  type="button"
                  css={viewToggleButtonStyles(
                    theme,
                    listOptions.viewMode === 'grid'
                  )}
                  onClick={() => handleViewModeChange('grid')}
                  aria-label="Grid view"
                  disabled={isLoading}
                >
                  <GridIcon />
                </button>
                <button
                  type="button"
                  css={viewToggleButtonStyles(
                    theme,
                    listOptions.viewMode === 'list'
                  )}
                  onClick={() => handleViewModeChange('list')}
                  aria-label="List view"
                  disabled={isLoading}
                >
                  <ListIcon />
                </button>
              </div>

              {onCreateTone && (
                <Button
                  variant="primary"
                  onClick={onCreateTone}
                  icon={<PlusIcon />}
                  iconPosition="left"
                  disabled={isLoading}
                >
                  Create Tone
                </Button>
              )}
            </div>
          </div>

          {/* Stats Summary */}
          <div css={statsSummaryStyles(theme)}>
            <span>
              <strong>{filteredTones.length}</strong> of{' '}
              <strong>{totalTones}</strong> tones
            </span>
            <span>
              <strong>{activeTones}</strong> active
            </span>
            <span>
              <strong>{favoriteTones}</strong> favorites
            </span>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <div css={bulkActionsStyles(theme, hasSelectedTones)}>
          <div css={bulkInfoStyles(theme)}>
            {selectedTones.size} {selectedTones.size === 1 ? 'tone' : 'tones'}{' '}
            selected
          </div>
          <div css={bulkActionsGroupStyles(theme)}>
            <Button variant="secondary" size="sm" onClick={handleBulkFavorite}>
              Add to Favorites
            </Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: theme.spacing[8] }}>
            <Loading size="lg" />
          </div>
        ) : filteredTones.length === 0 ? (
          <div css={emptyStateStyles(theme)}>
            <div css={emptyIconStyles(theme)}>
              <EmptyTonesIcon />
            </div>
            <h3 css={emptyTitleStyles(theme)}>
              {searchCriteria.query ? 'No tones found' : 'No tones yet'}
            </h3>
            <p css={emptyDescriptionStyles(theme)}>
              {searchCriteria.query
                ? "Try adjusting your search terms or filters to find the tones you're looking for."
                : 'Create your first tone to get started with AI-powered response generation.'}
            </p>
            {onCreateTone && !searchCriteria.query && (
              <Button
                variant="primary"
                onClick={onCreateTone}
                icon={<PlusIcon />}
                iconPosition="left"
              >
                Create Your First Tone
              </Button>
            )}
            {searchCriteria.query && (
              <Button
                variant="secondary"
                onClick={() =>
                  setSearchCriteria(prev => ({ ...prev, query: '' }))
                }
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div css={gridContainerStyles(theme, listOptions.viewMode)}>
            {filteredTones.map(tone => (
              <ToneCard
                key={tone.id}
                tone={tone}
                viewMode={listOptions.viewMode}
                showStats={listOptions.showStats}
                showPreview={listOptions.showPreview}
                selected={selectedTones.has(tone.id)}
                {...(onEditTone && { onEdit: onEditTone })}
                {...(onDeleteTone && { onDelete: onDeleteTone })}
                {...(onToggleFavorite && {
                  onToggleFavorite,
                })}
                onPreview={setPreviewTone}
                {...(hasSelectedTones && { onSelect: handleToneSelect })}
              />
            ))}
          </div>
        )}

        {/* Tone Preview Modal */}
        {previewTone && (
          <TonePreview
            tone={previewTone}
            isOpen={previewTone != null}
            onClose={() => setPreviewTone(null)}
            {...(onEditTone && { onEdit: onEditTone })}
            {...(onDeleteTone && { onDelete: onDeleteTone })}
            {...(onToggleFavorite && { onToggleFavorite })}
          />
        )}
      </PageContainer>
    );
  }
);

ToneListScreen.displayName = 'ToneListScreen';
