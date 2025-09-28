/**
 * BillingScreen component for managing subscription and usage statistics
 * Features usage limits, subscription management, and billing history (future enhancement)
 */

import { useState, useCallback, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { PageContainer } from '../../components/layout/PageContainer';
import type { LoadingState, LayoutError } from '../../components/layout/types';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { SectionCard } from './components/SectionCard';

/**
 * Usage statistics interface
 */
interface UsageStats {
  readonly currentPeriod: {
    readonly generationsUsed: number;
    readonly generationsLimit: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
  };
  readonly allTime: {
    readonly totalGenerations: number;
    readonly totalTones: number;
    readonly averageResponseTime: number;
    readonly memberSince: Date;
  };
}

/**
 * Subscription plan interface
 */
interface SubscriptionPlan {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly interval: 'month' | 'year';
  readonly generationsLimit: number;
  readonly features: readonly string[];
  readonly recommended?: boolean;
}

/**
 * Billing history interface
 */
interface BillingHistoryItem {
  readonly id: string;
  readonly date: Date;
  readonly description: string;
  readonly amount: number;
  readonly status: 'paid' | 'pending' | 'failed';
  readonly invoiceUrl?: string;
}

/**
 * Billing screen props interface
 */
export interface BillingScreenProps {
  readonly usageStats?: UsageStats;
  readonly currentPlan?: string;
  readonly availablePlans?: readonly SubscriptionPlan[];
  readonly billingHistory?: readonly BillingHistoryItem[];
  readonly loading?: LoadingState;
  readonly error?: LayoutError;
  readonly onUpgrade?: (planId: string) => Promise<void>;
  readonly onDowngrade?: (planId: string) => Promise<void>;
  readonly onCancelSubscription?: () => Promise<void>;
  readonly className?: string;
}

/**
 * Usage progress styles
 */
const usageProgressStyles = (theme: ThemeType, percentage: number) => css`
  width: 100%;
  height: 12px;
  background: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.full};
  overflow: hidden;
  margin: ${theme.spacing[2]} 0;
  
  &::after {
    content: '';
    display: block;
    width: ${percentage}%;
    height: 100%;
    background: ${percentage > 90 
      ? theme.colors.status.error 
      : percentage > 75 
        ? theme.colors.status.warning 
        : theme.colors.interactive.primary
    };
    transition: width 0.3s ease-in-out;
  }
`;

/**
 * Plan card styles
 */
const planCardStyles = (theme: ThemeType, recommended: boolean, current: boolean) => css`
  position: relative;
  padding: ${theme.spacing[6]};
  border-radius: ${theme.borderRadius.lg};
  background: ${current 
    ? theme.colors.background.secondary 
    : theme.colors.background.primary
  };
  border: 2px solid ${recommended 
    ? theme.colors.interactive.primary 
    : current 
      ? theme.colors.interactive.primary 
      : theme.colors.border.primary
  };
  text-align: center;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    border-color: ${theme.colors.interactive.primary};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  ${recommended && css`
    &::before {
      content: 'Recommended';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: ${theme.colors.interactive.primary};
      color: white;
      padding: ${theme.spacing[1]} ${theme.spacing[3]};
      border-radius: ${theme.borderRadius.full};
      font-size: ${theme.typography.fontSize.xs};
      font-weight: ${theme.typography.fontWeight.medium};
    }
  `}
`;

/**
 * Plan price styles
 */
const planPriceStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize['3xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: ${theme.spacing[2]} 0;
`;

/**
 * Feature list styles
 */
const featureListStyles = (theme: ThemeType) => css`
  list-style: none;
  padding: 0;
  margin: ${theme.spacing[4]} 0;
  
  li {
    padding: ${theme.spacing[1]} 0;
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
    
    &::before {
      content: '✓';
      color: ${theme.colors.status.success};
      font-weight: bold;
      margin-right: ${theme.spacing[2]};
    }
  }
`;

/**
 * Billing history item styles
 */
const billingItemStyles = (theme: ThemeType) => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background.secondary};
  border: 1px solid ${theme.colors.border.primary};
  margin-bottom: ${theme.spacing[2]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Status badge styles
 */
const statusBadgeStyles = (theme: ThemeType, status: 'paid' | 'pending' | 'failed') => css`
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  background: ${status === 'paid' 
    ? theme.colors.status.successBackground 
    : status === 'pending' 
      ? theme.colors.status.warningBackground 
      : theme.colors.status.errorBackground
  };
  color: ${status === 'paid' 
    ? theme.colors.status.success 
    : status === 'pending' 
      ? theme.colors.status.warning 
      : theme.colors.status.error
  };
  border: 1px solid ${status === 'paid' 
    ? theme.colors.status.success 
    : status === 'pending' 
      ? theme.colors.status.warning 
      : theme.colors.status.error
  };
`;

/**
 * Mock usage statistics
 */
const mockUsageStats: UsageStats = {
  currentPeriod: {
    generationsUsed: 847,
    generationsLimit: 1000,
    periodStart: new Date(2024, 8, 1), // September 1
    periodEnd: new Date(2024, 8, 30), // September 30
  },
  allTime: {
    totalGenerations: 12547,
    totalTones: 25,
    averageResponseTime: 1.2,
    memberSince: new Date(2024, 0, 15), // January 15
  },
};

/**
 * Mock subscription plans
 */
const mockPlans: readonly SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out the extension',
    price: 0,
    interval: 'month',
    generationsLimit: 100,
    features: [
      '100 AI generations per month',
      '5 custom tones',
      'Basic support',
      'Email notifications',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For regular users who need more flexibility',
    price: 9.99,
    interval: 'month',
    generationsLimit: 1000,
    features: [
      '1,000 AI generations per month',
      'Unlimited custom tones',
      'Priority support',
      'Advanced analytics',
      'Custom shortcuts',
    ],
    recommended: true,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For teams and heavy users',
    price: 29.99,
    interval: 'month',
    generationsLimit: 5000,
    features: [
      '5,000 AI generations per month',
      'Unlimited custom tones',
      'Team collaboration',
      'Analytics dashboard',
      'API access',
      'Dedicated support',
    ],
  },
];

/**
 * Mock billing history
 */
const mockBillingHistory: readonly BillingHistoryItem[] = [
  {
    id: '1',
    date: new Date(2024, 8, 1),
    description: 'Pro Plan - September 2024',
    amount: 9.99,
    status: 'paid',
    invoiceUrl: '#',
  },
  {
    id: '2',
    date: new Date(2024, 7, 1),
    description: 'Pro Plan - August 2024',
    amount: 9.99,
    status: 'paid',
    invoiceUrl: '#',
  },
  {
    id: '3',
    date: new Date(2024, 6, 1),
    description: 'Pro Plan - July 2024',
    amount: 9.99,
    status: 'paid',
    invoiceUrl: '#',
  },
];

/**
 * BillingScreen component with usage tracking and subscription management
 */
export const BillingScreen = forwardRef<HTMLDivElement, BillingScreenProps>(
  (
    {
      usageStats = mockUsageStats,
      currentPlan = 'pro',
      availablePlans = mockPlans,
      billingHistory = mockBillingHistory,
      loading = 'idle',
      error,
      onUpgrade,
      onDowngrade,
      onCancelSubscription,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const [showPlans, setShowPlans] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    const handlePlanChange = useCallback(
      async (planId: string): Promise<void> => {
        const currentPlanIndex = availablePlans.findIndex(p => p.id === currentPlan);
        const newPlanIndex = availablePlans.findIndex(p => p.id === planId);
        
        if (currentPlanIndex === -1 || newPlanIndex === -1) return;

        try {
          if (newPlanIndex > currentPlanIndex) {
            await onUpgrade?.(planId);
            setSuccessMessage('Successfully upgraded your plan!');
          } else {
            await onDowngrade?.(planId);
            setSuccessMessage('Successfully changed your plan!');
          }
          setShowPlans(false);
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch {
          // Error handling would be managed by parent component
        }
      },
      [availablePlans, currentPlan, onUpgrade, onDowngrade]
    );

    const handleCancelSubscription = useCallback(async (): Promise<void> => {
      if (!onCancelSubscription || !confirm('Are you sure you want to cancel your subscription?')) {
        return;
      }

      try {
        await onCancelSubscription();
        setSuccessMessage('Subscription cancelled successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch {
        // Error handling would be managed by parent component
      }
    }, [onCancelSubscription]);

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const usagePercentage = (usageStats.currentPeriod.generationsUsed / usageStats.currentPeriod.generationsLimit) * 100;
    const currentPlanData = availablePlans.find(p => p.id === currentPlan);

    return (
      <PageContainer
        ref={ref}
        title="Billing & Usage"
        description="Monitor your usage and manage your subscription"
        loading={loading}
        {...error && { error }}
        {...className && { className }}
        maxWidth="lg"
        padding="lg"
      >
        {successMessage && (
          <Alert status="success" variant="subtle" style={{ marginBottom: theme.spacing[6] }}>
            {successMessage}
          </Alert>
        )}

        {/* Current Usage */}
        <SectionCard
          title="Current Usage"
          description={`Usage for ${formatDate(usageStats.currentPeriod.periodStart)} - ${formatDate(usageStats.currentPeriod.periodEnd)}`}
          css={{ marginBottom: theme.spacing[6] }}
        >
          <div style={{ marginBottom: theme.spacing[4] }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: theme.spacing[2]
            }}>
              <span style={{ 
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary 
              }}>
                AI Generations
              </span>
              <span style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary 
              }}>
                {usageStats.currentPeriod.generationsUsed.toLocaleString()} / {usageStats.currentPeriod.generationsLimit.toLocaleString()}
              </span>
            </div>
            <div css={usageProgressStyles(theme, usagePercentage)} />
            {usagePercentage > 90 && (
              <Alert status="warning" variant="subtle" size="sm" style={{ marginTop: theme.spacing[2] }}>
                You're approaching your monthly limit. Consider upgrading your plan.
              </Alert>
            )}
          </div>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: theme.spacing[4],
            marginTop: theme.spacing[4]
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.interactive.primary 
              }}>
                {usageStats.allTime.totalGenerations.toLocaleString()}
              </div>
              <div style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary 
              }}>
                Total Generations
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.interactive.primary 
              }}>
                {usageStats.allTime.totalTones}
              </div>
              <div style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary 
              }}>
                Custom Tones
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.interactive.primary 
              }}>
                {usageStats.allTime.averageResponseTime}s
              </div>
              <div style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary 
              }}>
                Avg Response Time
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Current Subscription */}
        <SectionCard
          title="Current Subscription"
          description={currentPlanData ? `You are currently on the ${currentPlanData.name} plan` : 'No active subscription'}
          actions={
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <Button variant="primary" onClick={() => setShowPlans(true)}>
                {currentPlan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </Button>
              {currentPlan !== 'free' && (
                <Button variant="secondary" onClick={handleCancelSubscription}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          }
          css={{ marginBottom: theme.spacing[6] }}
        >
          {currentPlanData && (
            <div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: theme.spacing[2]
              }}>
                <span style={{ 
                  fontWeight: theme.typography.fontWeight.medium,
                  fontSize: theme.typography.fontSize.lg,
                  color: theme.colors.text.primary 
                }}>
                  {currentPlanData.name}
                </span>
                <span style={{ 
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.interactive.primary 
                }}>
                  {formatCurrency(currentPlanData.price)}/{currentPlanData.interval}
                </span>
              </div>
              <p style={{ 
                margin: 0,
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.sm 
              }}>
                {currentPlanData.description}
              </p>
            </div>
          )}
        </SectionCard>

        {/* Available Plans */}
        {showPlans && (
          <SectionCard
            title="Available Plans"
            description="Choose the plan that works best for you"
            actions={
              <Button variant="secondary" onClick={() => setShowPlans(false)}>
                Cancel
              </Button>
            }
            css={{ marginBottom: theme.spacing[6] }}
          >
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: theme.spacing[4]
            }}>
              {availablePlans.map(plan => (
                <div 
                  key={plan.id} 
                  css={planCardStyles(theme, plan.recommended ?? false, plan.id === currentPlan)}
                >
                  <h3 style={{ 
                    margin: 0,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary 
                  }}>
                    {plan.name}
                  </h3>
                  <div css={planPriceStyles(theme)}>
                    {formatCurrency(plan.price)}
                    <span style={{ 
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.normal,
                      color: theme.colors.text.secondary 
                    }}>
                      /{plan.interval}
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0,
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.fontSize.sm 
                  }}>
                    {plan.description}
                  </p>
                  <ul css={featureListStyles(theme)}>
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.id === currentPlan ? "secondary" : "primary"}
                    onClick={() => plan.id !== currentPlan && handlePlanChange(plan.id)}
                    disabled={plan.id === currentPlan}
                    style={{ width: '100%' }}
                  >
                    {plan.id === currentPlan ? 'Current Plan' : `Select ${plan.name}`}
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Billing History */}
        <SectionCard
          title="Billing History"
          description="View your past invoices and payments"
        >
          {billingHistory.length === 0 ? (
            <p style={{ 
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
              textAlign: 'center',
              padding: theme.spacing[4]
            }}>
              No billing history available.
            </p>
          ) : (
            billingHistory.map(item => (
              <div key={item.id} css={billingItemStyles(theme)}>
                <div>
                  <div style={{ 
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.text.primary,
                    marginBottom: theme.spacing[1]
                  }}>
                    {item.description}
                  </div>
                  <div style={{ 
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary 
                  }}>
                    {formatDate(item.date)}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[3]
                }}>
                  <div style={{ 
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.text.primary 
                  }}>
                    {formatCurrency(item.amount)}
                  </div>
                  <div css={statusBadgeStyles(theme, item.status)}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </div>
                  {item.invoiceUrl && item.status === 'paid' && (
                    <Button variant="secondary" size="sm">
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </SectionCard>
      </PageContainer>
    );
  }
);

BillingScreen.displayName = 'BillingScreen';