import React, { useState, useEffect } from 'react';
import { Spin, Typography, Progress, Space, Tag, Button } from 'antd';
import { useTranslation } from '../i18n/client';
import Link from 'next/link';
import { 
  ClockCircleOutlined, 
  SyncOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  LoadingOutlined,
  BookOutlined
} from '@ant-design/icons';

interface ProcessingIndicatorProps {
  step?: 'cloning' | 'analyzing' | 'generating' | 'completed';
  visible: boolean;
  // Optional repository status from backend (0-pending, 1-processing, 2-completed, 99-failed)
  repoStatus?: number;
  // Repository address for creating the wiki link
  repoAddress?: string;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ 
  step = 'cloning',
  visible,
  repoStatus,
  repoAddress
}) => {
  const { t } = useTranslation();
  const [autoRefresh, setAutoRefresh] = useState<NodeJS.Timeout | null>(null);
  
  // Set up auto-refresh if the indicator is visible and we're not completed
  useEffect(() => {
    if (visible && step !== 'completed') {
      const timer = setInterval(() => {
        // This would be where you could poll for repository status updates
        console.log('Checking repository status...');
      }, 5000); // Check every 5 seconds
      
      setAutoRefresh(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else if (autoRefresh) {
      clearInterval(autoRefresh);
      setAutoRefresh(null);
    }
  }, [visible, step]);
  
  if (!visible) return null;
  
  // Calculate progress based on the current step
  const getProgress = () => {
    switch (step) {
      case 'cloning':
        return 25;
      case 'analyzing':
        return 50;
      case 'generating':
        return 75;
      case 'completed':
        return 100;
      default:
        return 15;
    }
  };
  
  // Get the appropriate message for the current step
  const getMessage = () => {
    // If we have a repository status from the backend, use that
    if (repoStatus !== undefined) {
      switch (repoStatus) {
        case 0:
          return t('repository.status.pending', 'Repository pending processing...');
        case 1:
          return t('repository.status.processing', 'Processing repository...');
        case 2:
          return t('repository.status.completed', 'Wiki generation completed!');
        case 99:
          return t('repository.status.failed', 'Repository processing failed');
        default:
          return t('repository.status.unknown', 'Unknown status');
      }
    }
    
    // Otherwise use the frontend step
    switch (step) {
      case 'cloning':
        return t('processing.cloning', 'Cloning repository...');
      case 'analyzing':
        return t('processing.analyzing', 'Analyzing code structure...');
      case 'generating':
        return t('processing.generating', 'Generating documentation...');
      case 'completed':
        return t('processing.completed', 'Wiki generation completed!');
      default:
        return t('processing.processing', 'Processing repository...');
    }
  };
  
  // Get status tag based on repository status
  const getStatusTag = () => {
    if (repoStatus !== undefined) {
      switch (repoStatus) {
        case 0:
          return <Tag color="warning" icon={<ClockCircleOutlined />}>{t('repository.status.pending', 'Pending')}</Tag>;
        case 1:
          return <Tag color="processing" icon={<SyncOutlined spin />}>{t('repository.status.processing', 'Processing')}</Tag>;
        case 2:
          return <Tag color="success" icon={<CheckCircleOutlined />}>{t('repository.status.completed', 'Completed')}</Tag>;
        case 99:
          return <Tag color="error" icon={<ExclamationCircleOutlined />}>{t('repository.status.failed', 'Failed')}</Tag>;
        default:
          return null;
      }
    }
    
    // Use frontend step for tag if no backend status
    switch (step) {
      case 'cloning':
        return <Tag color="processing" icon={<LoadingOutlined spin />}>{t('processing.cloning_short', 'Cloning')}</Tag>;
      case 'analyzing':
        return <Tag color="processing" icon={<SyncOutlined spin />}>{t('processing.analyzing_short', 'Analyzing')}</Tag>;
      case 'generating':
        return <Tag color="processing" icon={<SyncOutlined spin />}>{t('processing.generating_short', 'Generating')}</Tag>;
      case 'completed':
        return <Tag color="success" icon={<CheckCircleOutlined />}>{t('processing.completed_short', 'Completed')}</Tag>;
      default:
        return <Tag color="processing" icon={<SyncOutlined spin />}>{t('processing.processing_short', 'Processing')}</Tag>;
    }
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.75)', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <Space direction="vertical" align="center" size="large" style={{ width: '100%' }}>
          <Spin size="large" />
          
          <Progress 
            percent={getProgress()} 
            status={step === 'completed' ? 'success' : 'active'} 
            style={{ width: '100%' }}
            strokeWidth={8}
            showInfo={true}
          />
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '16px 0' }}>
            <Typography.Title level={3} style={{ margin: '0 8px 0 0', textAlign: 'center' }}>
              {getMessage()}
            </Typography.Title>
            {getStatusTag()}
          </div>
          
          <Typography.Paragraph style={{ fontSize: '16px', textAlign: 'center' }}>
            {t('processing.please_wait', 'Please wait while we process your repository. This may take a few minutes depending on the size of the repository.')}
          </Typography.Paragraph>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Typography.Text type="secondary">
              {step === 'cloning' && t('processing.cloning_details', 'Downloading repository files and preparing workspace...')}
              {step === 'analyzing' && t('processing.analyzing_details', 'Examining code structure, dependencies, and organization...')}
              {step === 'generating' && t('processing.generating_details', 'Creating documentation, diagrams, and explanations...')}
              {step === 'completed' && t('processing.completed_details', 'Your wiki has been successfully generated!')}
            </Typography.Text>
          </div>
          
          {/* Add button to view wiki when processing is complete */}
          {(step === 'completed' || repoStatus === 2) && repoAddress && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link href={`/wiki?address=${encodeURIComponent(repoAddress)}`} passHref>
                <Button type="primary" size="large" icon={<BookOutlined />}>
                  {t('processing.view_wiki', 'View Wiki')}
                </Button>
              </Link>
            </div>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ProcessingIndicator;
