import React, { useState, useEffect } from 'react';
import { Card, Grid, Box, Text, Flex, Badge, Button, Stack } from '@sanity/ui';
import { ChartUpwardIcon, TrendUpwardIcon, UsersIcon, EyeOpenIcon } from '@sanity/icons';

// Mock analytics data structure (would come from Segment.io/GA in real implementation)
interface ExperimentMetrics {
  segmentId: string;
  segmentName: string;
  componentType: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  clickThroughRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
  revenue: number;
  confidence: number;
  isWinner: boolean;
}

interface TimeSeriesData {
  date: string;
  impressions: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  clickThroughRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
}

interface DocumentSegmentUsage {
  segmentId: string;
  segmentName: string;
  componentType: string;
  componentCount: number;
}

interface PersonalizationConfig {
  usedSegments: DocumentSegmentUsage[];
  totalPersonalizedComponents: number;
}

// Generate realistic marketing metrics for segments
const generateMarketingMetrics = (segmentName: string, componentType: string, baselineConversion: number = 1.2) => {
  // Create realistic variations based on segment characteristics
  const segmentMultipliers: Record<string, { conversion: number; ctr: number; revenue: number; confidence: number }> = {
    'mobile users': { conversion: 1.45, ctr: 1.25, revenue: 0.85, confidence: 96.5 },
    'desktop users': { conversion: 0.95, ctr: 0.88, revenue: 1.35, confidence: 94.2 },
    'new visitors': { conversion: 0.78, ctr: 1.15, revenue: 0.92, confidence: 89.1 },
    'returning visitors': { conversion: 1.85, ctr: 1.05, revenue: 1.45, confidence: 98.2 },
    'us visitors': { conversion: 1.25, ctr: 1.18, revenue: 1.25, confidence: 95.8 },
    'european visitors': { conversion: 1.15, ctr: 0.95, revenue: 1.15, confidence: 93.4 },
    'high-value customers': { conversion: 2.45, ctr: 1.35, revenue: 2.85, confidence: 99.1 },
    'first-time buyers': { conversion: 0.65, ctr: 1.45, revenue: 0.75, confidence: 87.6 },
    'enterprise users': { conversion: 1.95, ctr: 0.85, revenue: 3.25, confidence: 97.8 },
    'small business': { conversion: 1.35, ctr: 1.25, revenue: 1.05, confidence: 94.9 },
  };

  const normalizedName = segmentName.toLowerCase();
  const multiplier = segmentMultipliers[normalizedName] || { 
    conversion: 0.9 + Math.random() * 0.6, 
    ctr: 0.85 + Math.random() * 0.5, 
    revenue: 0.8 + Math.random() * 0.8,
    confidence: 85 + Math.random() * 12
  };

  const baseImpressions = Math.floor(Math.random() * 8000) + 4000;
  const clickThroughRate = (8.5 + Math.random() * 4) * multiplier.ctr;
  const clicks = Math.floor(baseImpressions * (clickThroughRate / 100));
  const conversionRate = baselineConversion * multiplier.conversion;
  const conversions = Math.floor(baseImpressions * (conversionRate / 100));
  const revenuePerConversion = (120 + Math.random() * 80) * multiplier.revenue;
  const revenue = conversions * revenuePerConversion;

  return {
    impressions: baseImpressions,
    clicks,
    conversions,
    conversionRate: Number(conversionRate.toFixed(2)),
    clickThroughRate: Number(clickThroughRate.toFixed(2)),
    averageTimeOnPage: Math.floor(120 + Math.random() * 80),
    bounceRate: Number((45 + Math.random() * 25).toFixed(1)),
    revenue: Math.floor(revenue),
    confidence: Number(multiplier.confidence.toFixed(1)),
    isWinner: conversionRate > baselineConversion && multiplier.confidence > 95,
  };
};

// Generate analytics data based on document personalization
const generateAnalyticsData = (documentId: string, documentType: string, personalizationConfig: PersonalizationConfig): {
  experiments: ExperimentMetrics[];
  timeSeries: TimeSeriesData[];
  summary: {
    totalExperiments: number;
    totalImpressions: number;
    averageUplift: number;
    activeSegments: number;
  };
  pageInfo: {
    documentId: string;
    documentType: string;
    url: string;
  };
} => {
  const experiments: ExperimentMetrics[] = [];
  const baselineConversion = 1.2;

  // Always include a control group with intentionally lower performance
  const controlMetrics = {
    impressions: Math.floor(Math.random() * 6000) + 3000,
    clicks: 0,
    conversions: 0,
    conversionRate: baselineConversion,
    clickThroughRate: 6.5 + Math.random() * 2, // Lower CTR
    averageTimeOnPage: Math.floor(90 + Math.random() * 40), // Lower time
    bounceRate: Number((55 + Math.random() * 15).toFixed(1)), // Higher bounce rate
    revenue: 0,
    confidence: 99.5,
    isWinner: false,
  };
  
  // Calculate dependent metrics for control
  controlMetrics.clicks = Math.floor(controlMetrics.impressions * (controlMetrics.clickThroughRate / 100));
  controlMetrics.conversions = Math.floor(controlMetrics.impressions * (baselineConversion / 100));
  controlMetrics.revenue = controlMetrics.conversions * (100 + Math.random() * 50); // Lower revenue per conversion

  experiments.push({
    segmentId: 'default',
    segmentName: 'Default (Control)',
    componentType: 'All Components',
    ...controlMetrics,
  });

  // Generate realistic data for actual segments used in the document (always better than control)
  personalizationConfig.usedSegments.forEach((segmentUsage) => {
    const metrics = generateMarketingMetrics(segmentUsage.segmentName, segmentUsage.componentType, baselineConversion);
    
    experiments.push({
      segmentId: segmentUsage.segmentId,
      segmentName: segmentUsage.segmentName,
      componentType: segmentUsage.componentType,
      ...metrics,
    });
  });

  // Generate time series data
  const timeSeries: TimeSeriesData[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    timeSeries.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.floor(Math.random() * 1000) + 500,
      conversions: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      conversionRate: baselineConversion + Math.random() * 2,
      clickThroughRate: 8 + Math.random() * 4,
      averageTimeOnPage: Math.floor(120 + Math.random() * 60),
      bounceRate: 45 + Math.random() * 20,
    });
  }

  return {
    experiments,
    timeSeries,
    summary: {
      totalExperiments: experiments.length,
      totalImpressions: experiments.reduce((sum, exp) => sum + exp.impressions, 0),
      averageUplift: 24.3,
      activeSegments: experiments.filter(exp => exp.segmentId !== 'default').length,
    },
    pageInfo: {
      documentId,
      documentType,
      url: documentType === 'homePage' ? '/' : `/page-url-here`,
    },
  };
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
}> = ({ title, value, change, positive, icon }) => (
  <Card padding={4} tone="default" border>
    <Flex align="center" justify="space-between">
      <Stack space={2}>
        <Text size={1} weight="medium" muted>
          {title}
        </Text>
        <Text size={3} weight="bold">
          {value}
        </Text>
        {change && (
          <Badge
            tone={positive ? 'positive' : 'critical'}
            mode="outline"
          >
            {change}
          </Badge>
        )}
      </Stack>
      {icon && <Box>{icon}</Box>}
    </Flex>
  </Card>
);

// Simple bar chart component
const ComparisonChart: React.FC<{
  data: { label: string; value: number; isWinner?: boolean; description?: string }[];
  title: string;
  valueLabel: string;
  metricType: string;
  description?: string;
}> = ({ data, title, valueLabel, metricType, description }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const formatValue = (value: number) => {
    switch (metricType) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toFixed(2);
    }
  };
  
  return (
    <Card padding={4} border>
      <Stack space={3}>
        <Stack space={2}>
          <Text size={2} weight="bold">{title}</Text>
          {description && (
            <Text size={1} muted>{description}</Text>
          )}
        </Stack>
        <Stack space={2}>
          {data.map((item, index) => (
            <Box key={index}>
              <Flex align="center" justify="space-between" style={{ marginBottom: '4px' }}>
                <Text size={1}>{item.label}</Text>
                <Flex align="center" gap={1}>
                  <Text size={1} weight="medium">{formatValue(item.value)}</Text>
                  {item.isWinner && <Badge tone="positive" mode="outline">Winner</Badge>}
                </Flex>
              </Flex>
              <Box
                style={{
                  height: '8px',
                  backgroundColor: '#f1f3f4',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <Box
                  style={{
                    height: '100%',
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.isWinner ? '#22c55e' : '#3b82f6',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};

// Comparison time series chart (Default vs Personalized)
const TimeSeriesChart: React.FC<{
  data: TimeSeriesData[];
  title: string;
  metricType: 'conversion' | 'revenue' | 'ctr' | 'views' | 'time' | 'bounce';
  experiments: ExperimentMetrics[];
}> = ({ data, title, metricType, experiments }) => {
  const getMetricValue = (point: TimeSeriesData, isPersonalized: boolean = false) => {
    let baseValue: number;
    switch (metricType) {
      case 'conversion': baseValue = point.conversionRate; break;
      case 'revenue': baseValue = point.revenue; break;
      case 'ctr': baseValue = point.clickThroughRate; break;
      case 'views': baseValue = point.impressions; break;
      case 'time': baseValue = point.averageTimeOnPage; break;
      case 'bounce': baseValue = point.bounceRate; break;
      default: baseValue = point.conversions;
    }
    
    if (isPersonalized) {
      // Calculate average uplift from personalized segments
      const personalizedSegments = experiments.filter(exp => exp.segmentId !== 'default');
      const controlSegment = experiments.find(exp => exp.segmentId === 'default');
      
      if (personalizedSegments.length > 0 && controlSegment) {
        let avgUpliftMultiplier = 0;
        personalizedSegments.forEach(segment => {
          const segmentValue = getSegmentMetricValue(segment, metricType);
          const controlValue = getSegmentMetricValue(controlSegment, metricType);
          if (controlValue > 0) {
            avgUpliftMultiplier += segmentValue / controlValue;
          }
        });
        avgUpliftMultiplier = avgUpliftMultiplier / personalizedSegments.length;
        return baseValue * avgUpliftMultiplier;
      }
    }
    
    return baseValue;
  };

  const getSegmentMetricValue = (segment: ExperimentMetrics, metric: string) => {
    switch (metric) {
      case 'conversion': return segment.conversionRate;
      case 'revenue': return segment.revenue;
      case 'ctr': return segment.clickThroughRate;
      case 'views': return segment.impressions;
      case 'time': return segment.averageTimeOnPage;
      case 'bounce': return segment.bounceRate;
      default: return segment.conversions;
    }
  };

  const formatValue = (value: number) => {
    switch (metricType) {
      case 'conversion': return `${value.toFixed(1)}%`;
      case 'revenue': return `$${value.toLocaleString()}`;
      case 'ctr': return `${value.toFixed(1)}%`;
      case 'views': return value.toLocaleString();
      case 'time': return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`;
      case 'bounce': return `${value.toFixed(1)}%`;
      default: return value.toString();
    }
  };

  const defaultValues = data.map(point => getMetricValue(point, false));
  const personalizedValues = data.map(point => getMetricValue(point, true));
  const allValues = [...defaultValues, ...personalizedValues];
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;
  
  return (
    <Card padding={4} border>
      <Stack space={3}>
        <Text size={2} weight="bold">{title}</Text>
        
        {/* Legend */}
        <Flex gap={4}>
          <Flex align="center" gap={2}>
            <Box style={{ width: '12px', height: '12px', backgroundColor: '#6b7280', borderRadius: '50%' }} />
            <Text size={1} muted>Default Content</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }} />
            <Text size={1} muted>Personalized Content</Text>
          </Flex>
        </Flex>
        
        <Box style={{ height: '200px', position: 'relative' }}>
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Default content line */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const value = getMetricValue(point, false);
              const y = 100 - ((value - minValue) / range) * 80;
              const nextPoint = data[index + 1];
              
              return (
                <g key={`default-${index}`}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill="#6b7280"
                  />
                  {nextPoint && (
                    <line
                      x1={`${x}%`}
                      y1={`${y}%`}
                      x2={`${((index + 1) / (data.length - 1)) * 100}%`}
                      y2={`${100 - ((getMetricValue(nextPoint, false) - minValue) / range) * 80}%`}
                      stroke="#6b7280"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                </g>
              );
            })}
            
            {/* Personalized content line */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const value = getMetricValue(point, true);
              const y = 100 - ((value - minValue) / range) * 80;
              const nextPoint = data[index + 1];
              
              return (
                <g key={`personalized-${index}`}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill="#10b981"
                  />
                  {nextPoint && (
                    <line
                      x1={`${x}%`}
                      y1={`${y}%`}
                      x2={`${((index + 1) / (data.length - 1)) * 100}%`}
                      y2={`${100 - ((getMetricValue(nextPoint, true) - minValue) / range) * 80}%`}
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </Box>
        
        <Flex justify="space-between">
          <Text size={1} muted>{data[0]?.date}</Text>
          <Text size={1} muted>{data[data.length - 1]?.date}</Text>
        </Flex>
        
        {/* Performance summary */}
        <Card padding={3} tone="positive" border>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="medium">📈 Personalization Impact</Text>
            <Text size={1} weight="bold">
              {(() => {
                const avgDefault = defaultValues.reduce((a, b) => a + b, 0) / defaultValues.length;
                const avgPersonalized = personalizedValues.reduce((a, b) => a + b, 0) / personalizedValues.length;
                const improvement = ((avgPersonalized - avgDefault) / avgDefault) * 100;
                const isPositive = metricType === 'bounce' ? improvement < 0 : improvement > 0;
                return isPositive ? 
                  `+${Math.abs(improvement).toFixed(1)}% improvement` : 
                  `${improvement.toFixed(1)}% change`;
              })()}
            </Text>
          </Flex>
        </Card>
      </Stack>
    </Card>
  );
};

const ExperimentRow: React.FC<{ experiment: ExperimentMetrics }> = ({ experiment }) => (
  <Card padding={4} tone={experiment.isWinner ? 'positive' : 'default'} border>
    <Grid columns={[1, 1, 3]} gap={3}>
      <Stack space={2}>
        <Flex align="center" gap={2}>
          <Text weight="bold">{experiment.segmentName}</Text>
          {experiment.isWinner && (
            <Badge tone="positive" mode="default">
              Winner
            </Badge>
          )}
          {experiment.segmentId === 'default' && (
            <Badge tone="caution" mode="outline">
              Control
            </Badge>
          )}
        </Flex>
        <Text size={1} muted>
          {experiment.componentType} Component
        </Text>
      </Stack>

      <Grid columns={3} gap={3}>
        <Stack space={1}>
          <Text size={1} muted>Conversion Rate</Text>
          <Text weight="bold" size={2}>{experiment.conversionRate}%</Text>
        </Stack>
        <Stack space={1}>
          <Text size={1} muted>Views</Text>
          <Text weight="bold" size={2}>{experiment.impressions.toLocaleString()}</Text>
        </Stack>
        <Stack space={1}>
          <Text size={1} muted>Revenue</Text>
          <Text weight="bold" size={2}>${experiment.revenue.toLocaleString()}</Text>
        </Stack>
      </Grid>
    </Grid>
  </Card>
);

interface AnalyticsPaneProps {
  document: {
    _id: string;
    _type: string;
    title?: string;
    slug?: { current: string };
  };
  personalizationConfig?: PersonalizationConfig;
}

export const AnalyticsPane: React.FC<AnalyticsPaneProps> = ({ document, personalizationConfig }) => {
  const [data, setData] = useState<ReturnType<typeof generateAnalyticsData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'conversion' | 'revenue' | 'ctr' | 'views' | 'time' | 'bounce'>('conversion');

  // Safety check for document prop
  if (!document || typeof document !== 'object') {
    return (
      <Box padding={4}>
        <Card padding={4} tone="critical">
          <Text>Invalid document data provided</Text>
        </Card>
      </Box>
    );
  }

  const safeDocument = {
    _id: String(document._id || 'unknown'),
    _type: String(document._type || 'unknown'),
    title: typeof document.title === 'string' ? document.title : 'Untitled',
    slug: document.slug,
  };

  useEffect(() => {
    // Generate analytics data based on personalization configuration
    const fetchAnalytics = async () => {
      setLoading(true);
      
      try {
        // Load analytics data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const config = personalizationConfig || { usedSegments: [], totalPersonalizedComponents: 0 };
        setData(generateAnalyticsData(safeDocument._id, safeDocument._type, config));
      } catch (error) {
        console.error('Error loading analytics:', error);
        const emptyConfig = { usedSegments: [], totalPersonalizedComponents: 0 };
        setData(generateAnalyticsData(safeDocument._id, safeDocument._type, emptyConfig));
      }
      
      setLoading(false);
    };

    fetchAnalytics();
  }, [timeRange, safeDocument._id, personalizationConfig]);

  if (loading) {
    return (
      <Box padding={4}>
        <Card padding={4} tone="transparent">
          <Text>Loading analytics...</Text>
        </Card>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box padding={4}>
        <Card padding={4} tone="critical">
          <Text>Unable to load analytics</Text>
        </Card>
      </Box>
    );
  }

  return (
    <Box padding={4}>
      <Stack space={5}>
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Text size={4} weight="bold">
              Personalization Analytics
            </Text>
            <Text size={1} muted>
              Performance metrics for "{safeDocument.title}" ({safeDocument._type})
            </Text>
            {data.pageInfo?.url && (
              <Text size={1} muted>
                Page URL: {String(data.pageInfo.url)}
              </Text>
            )}
          </Stack>
          <Flex gap={2}>
            <Button
              mode={timeRange === '7d' ? 'default' : 'ghost'}
              tone={timeRange === '7d' ? 'primary' : 'default'}
              onClick={() => setTimeRange('7d')}
              text="7 days"
            />
            <Button
              mode={timeRange === '30d' ? 'default' : 'ghost'}
              tone={timeRange === '30d' ? 'primary' : 'default'}
              onClick={() => setTimeRange('30d')}
              text="30 days"
            />
            <Button
              mode={timeRange === '90d' ? 'default' : 'ghost'}
              tone={timeRange === '90d' ? 'primary' : 'default'}
              onClick={() => setTimeRange('90d')}
              text="90 days"
            />
          </Flex>
        </Flex>

        {/* Key Metrics */}
        <Grid columns={[1, 2, 3]} gap={4}>
          <MetricCard
            title="Page Views"
            value={data.summary.totalImpressions.toLocaleString()}
            change="+12%"
            positive={true}
            icon={<EyeOpenIcon />}
          />
          <MetricCard
            title="Performance Boost"
            value={`+${data.summary.averageUplift}%`}
            change="vs. no personalization"
            positive={true}
            icon={<TrendUpwardIcon />}
          />
          <MetricCard
            title="Active Segments"
            value={data.summary.activeSegments}
            change="personalized audiences"
            icon={<UsersIcon />}
          />
        </Grid>

        {/* Active Segments */}
        {personalizationConfig && personalizationConfig.usedSegments.length > 0 && (
          <Card padding={4} tone="positive" border>
            <Stack space={3}>
              <Flex align="center" gap={2}>
                <Text size={2} weight="bold">🎯 Personalized for</Text>
                <Badge tone="positive" mode="default">{personalizationConfig.usedSegments.length} audiences</Badge>
              </Flex>
              <Flex gap={2} wrap="wrap">
                {personalizationConfig.usedSegments.map((segment) => (
                  <Badge key={segment.segmentId} tone="primary" mode="outline" padding={3}>
                    {segment.segmentName}
                  </Badge>
                ))}
              </Flex>
            </Stack>
          </Card>
        )}

        {/* Interactive Comparison Chart */}
        {data.experiments.length > 1 && (
          <Stack space={4}>
            {/* Metric Selector */}
            <Card padding={3} tone="transparent">
              <Stack space={3}>
                <Text size={2} weight="bold">📊 Compare Audiences</Text>
                <Flex gap={2} wrap="wrap">
                  <Button
                    mode={selectedMetric === 'conversion' ? 'default' : 'ghost'}
                    tone={selectedMetric === 'conversion' ? 'primary' : 'default'}
                    onClick={() => setSelectedMetric('conversion')}
                    text="Conversion Rate"
                  />
                  <Button
                    mode={selectedMetric === 'revenue' ? 'default' : 'ghost'}
                    tone={selectedMetric === 'revenue' ? 'primary' : 'default'}
                    onClick={() => setSelectedMetric('revenue')}
                    text="Revenue"
                  />
                  <Button
                    mode={selectedMetric === 'ctr' ? 'default' : 'ghost'}
                    tone={selectedMetric === 'ctr' ? 'primary' : 'default'}
                    onClick={() => setSelectedMetric('ctr')}
                    text="Click Rate"
                  />
                  <Button
                    mode={selectedMetric === 'views' ? 'default' : 'ghost'}
                    tone={selectedMetric === 'views' ? 'primary' : 'default'}
                    onClick={() => setSelectedMetric('views')}
                    text="Page Views"
                  />
                  <Button
                    mode={selectedMetric === 'time' ? 'default' : 'ghost'}
                    tone={selectedMetric === 'time' ? 'primary' : 'default'}
                    onClick={() => setSelectedMetric('time')}
                    text="Time on Page"
                  />
                  <Button
                    mode={selectedMetric === 'bounce' ? 'default' : 'ghost'}
                    tone={selectedMetric === 'bounce' ? 'primary' : 'default'}
                    onClick={() => setSelectedMetric('bounce')}
                    text="Bounce Rate"
                  />
                </Flex>
              </Stack>
            </Card>

            {/* Dynamic Chart */}
            {(() => {
              const getChartData = () => {
                switch (selectedMetric) {
                  case 'conversion':
                    return {
                      data: data.experiments.map(exp => ({
                        label: exp.segmentName.replace(' (Control)', ''),
                        value: exp.conversionRate,
                        isWinner: exp.isWinner
                      })),
                      title: "Conversion Rate Comparison",
                      description: "Percentage of visitors who complete desired actions",
                      metricType: "percentage",
                      valueLabel: "%"
                    };
                  case 'revenue':
                    return {
                      data: data.experiments.map(exp => ({
                        label: exp.segmentName.replace(' (Control)', ''),
                        value: exp.revenue,
                        isWinner: exp.isWinner
                      })),
                      title: "Revenue Comparison",
                      description: "Total revenue generated by each audience segment",
                      metricType: "currency",
                      valueLabel: "$"
                    };
                  case 'ctr':
                    return {
                      data: data.experiments.map(exp => ({
                        label: exp.segmentName.replace(' (Control)', ''),
                        value: exp.clickThroughRate,
                        isWinner: exp.isWinner
                      })),
                      title: "Click-Through Rate Comparison",
                      description: "Percentage of visitors who click on interactive elements",
                      metricType: "percentage",
                      valueLabel: "%"
                    };
                  case 'views':
                    return {
                      data: data.experiments.map(exp => ({
                        label: exp.segmentName.replace(' (Control)', ''),
                        value: exp.impressions,
                        isWinner: exp.isWinner
                      })),
                      title: "Page Views Comparison",
                      description: "Total number of page views by audience segment",
                      metricType: "number",
                      valueLabel: ""
                    };
                  case 'time':
                    return {
                      data: data.experiments.map(exp => ({
                        label: exp.segmentName.replace(' (Control)', ''),
                        value: exp.averageTimeOnPage,
                        isWinner: exp.isWinner && exp.averageTimeOnPage > 120
                      })),
                      title: "Time on Page Comparison",
                      description: "Average time visitors spend on the page",
                      metricType: "time",
                      valueLabel: "s"
                    };
                  case 'bounce':
                    return {
                      data: data.experiments.map(exp => ({
                        label: exp.segmentName.replace(' (Control)', ''),
                        value: exp.bounceRate,
                        isWinner: exp.isWinner && exp.bounceRate < 50
                      })),
                      title: "Bounce Rate Comparison",
                      description: "Percentage of visitors who leave without interacting (lower is better)",
                      metricType: "percentage",
                      valueLabel: "%"
                    };
                  default:
                    return null;
                }
              };

              const chartData = getChartData();
              if (!chartData) return null;

              return (
                <ComparisonChart
                  data={chartData.data}
                  title={chartData.title}
                  description={chartData.description}
                  metricType={chartData.metricType}
                  valueLabel={chartData.valueLabel}
                />
              );
            })()}
          </Stack>
        )}

        {/* Time Series Trend */}
        {data.timeSeries.length > 0 && (
          <TimeSeriesChart
            data={data.timeSeries}
            title={(() => {
              switch (selectedMetric) {
                case 'conversion': return "Conversion Rate: Default vs Personalized";
                case 'revenue': return "Revenue: Default vs Personalized";
                case 'ctr': return "Click-Through Rate: Default vs Personalized";
                case 'views': return "Page Views: Default vs Personalized";
                case 'time': return "Time on Page: Default vs Personalized";
                case 'bounce': return "Bounce Rate: Default vs Personalized";
                default: return "Default vs Personalized";
              }
            })()}
            metricType={selectedMetric}
            experiments={data.experiments}
          />
        )}

        {/* Detailed Results */}
        {data.experiments.length > 0 && (
          <Stack space={3}>
            <Text size={2} weight="bold">
              📊 Detailed Performance
            </Text>
            <Stack space={3}>
              {data.experiments.map((experiment) => (
                <ExperimentRow
                  key={experiment.segmentId}
                  experiment={experiment}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {/* Key Results */}
        {data.experiments.length > 1 && (
          <Card padding={4} tone="positive" border>
            <Stack space={3}>
              <Text size={2} weight="bold">
                ✨ Results
              </Text>
              {(() => {
                const sortedByConversion = [...data.experiments]
                  .filter(exp => exp.segmentId !== 'default')
                  .sort((a, b) => b.conversionRate - a.conversionRate);
                const bestSegment = sortedByConversion[0];
                const control = data.experiments.find(exp => exp.segmentId === 'default');
                
                if (bestSegment && control) {
                  const uplift = ((bestSegment.conversionRate - control.conversionRate) / control.conversionRate * 100).toFixed(0);
                  const winners = data.experiments.filter(exp => exp.isWinner).length;
                  
                  return (
                    <Stack space={2}>
                      <Text size={2} weight="medium">
                        🏆 Top performing audience: <strong>{bestSegment.segmentName}</strong>
                      </Text>
                      <Text size={1}>
                        Converts <strong>{uplift}% better</strong> than baseline
                      </Text>
                      {winners > 0 && (
                        <Text size={1} muted>
                          {winners} of {data.experiments.length - 1} audiences exceed baseline performance
                        </Text>
                      )}
                    </Stack>
                  );
                }
                return null;
              })()}
            </Stack>
          </Card>
        )}


      </Stack>
    </Box>
  );
}; 