'use client'
import { useState, useEffect } from 'react';
import { Button, Typography, Layout, Space, Input, Empty, Card, Row, Col, Statistic, Pagination, message, ConfigProvider, Divider, Avatar, Tag, Badge } from 'antd';
import {
  PlusOutlined,
  GithubOutlined,
  SearchOutlined,
  BookOutlined,
  StarOutlined,
  RocketOutlined,
  CodeOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import RepositoryForm from './RepositoryForm';
import RepositoryList from './RepositoryList';
import LastRepoModal from './LastRepoModal';
import ProcessingIndicator from './ProcessingIndicator';
import LanguageSwitcher from './LanguageSwitcher';
import { Repository, RepositoryFormValues } from '../types';
import { submitWarehouse } from '../services/warehouseService';
import { unstableSetRender } from 'antd';
import { createRoot } from 'react-dom/client';
import { homepage } from '../const/urlconst';
import { useTranslation } from '../i18n/client';
import { useSearchParams } from 'next/navigation';

const { Content, Header, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

// 现代简约设计系统 - 增强版光晕效果
const designSystem = {
  colors: {
    primary: '#2563eb',      // 专业蓝色
    primaryLight: '#3b82f6', // 浅蓝色
    primaryDark: '#1d4ed8',  // 深蓝色
    success: '#059669',      // 成功绿色
    warning: '#d97706',      // 警告橙色
    error: '#dc2626',        // 错误红色
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    glow: {
      primary: 'rgba(37, 99, 235, 0.15)',
      secondary: 'rgba(37, 99, 235, 0.08)',
      accent: 'rgba(59, 130, 246, 0.12)',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgba(37, 99, 235, 0.15), 0 0 40px rgba(37, 99, 235, 0.08)',
    glowHover: '0 0 30px rgba(37, 99, 235, 0.25), 0 0 60px rgba(37, 99, 235, 0.12)',
  }
};

// 优化的主题配置 - 支持光晕效果
const modernTheme = {
  token: {
    colorPrimary: designSystem.colors.primary,
    colorSuccess: designSystem.colors.success,
    colorWarning: designSystem.colors.warning,
    colorError: designSystem.colors.error,
    colorBgContainer: designSystem.colors.background.primary,
    colorBgLayout: designSystem.colors.background.secondary,
    colorText: designSystem.colors.neutral[800],
    colorTextSecondary: designSystem.colors.neutral[500],
    colorTextTertiary: designSystem.colors.neutral[400],
    colorBorder: designSystem.colors.neutral[200],
    colorBorderSecondary: designSystem.colors.neutral[100],
    borderRadius: designSystem.borderRadius.md,
    borderRadiusLG: designSystem.borderRadius.lg,
    borderRadiusSM: designSystem.borderRadius.sm,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    lineHeight: 1.5,
    lineHeightHeading: 1.2,
    boxShadow: designSystem.shadows.md,
    boxShadowSecondary: designSystem.shadows.sm,
  },
  components: {
    Layout: {
      headerBg: designSystem.colors.background.primary,
      headerHeight: 64,
      headerPadding: '0 24px',
      footerBg: designSystem.colors.background.primary,
      bodyBg: designSystem.colors.background.secondary,
    },
    Button: {
      borderRadius: designSystem.borderRadius.md,
      controlHeight: 40,
      controlHeightLG: 48,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Card: {
      borderRadius: designSystem.borderRadius.lg,
      boxShadow: designSystem.shadows.sm,
      headerBg: 'transparent',
      paddingLG: designSystem.spacing.xl,
    },
    Input: {
      borderRadius: designSystem.borderRadius.md,
      controlHeight: 40,
      controlHeightLG: 48,
    },
    Typography: {
      titleMarginBottom: '0.5em',
      titleMarginTop: 0,
    },
    Tag: {
      borderRadius: designSystem.borderRadius.xl,
      fontWeight: 500,
    },
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 28,
      fontFamily: 'inherit',
    },
  },
};

// 页脚链接配置
const footerLinks = {
  product: [
    { titleKey: 'footer.features', link: 'https://github.com/AIDotNet/OpenDeepWiki/blob/main/README.md' },
    { titleKey: 'footer.guide', link: 'https://github.com/AIDotNet/OpenDeepWiki/blob/main/README.md' },
    { titleKey: 'footer.changelog', link: 'https://github.com/AIDotNet/OpenDeepWiki/blob/main/README.md' },
  ],
  resources: [
    { titleKey: 'footer.docs', link: 'https://github.com/AIDotNet/OpenDeepWiki/blob/main/README.md' },
    { titleKey: 'footer.api', link: 'https://github.com/AIDotNet/OpenDeepWiki/blob/main/README.md' },
    { titleKey: 'footer.faq', link: 'https://github.com/AIDotNet/OpenDeepWiki/issues' },
  ],
  company: [
    { titleKey: 'footer.about', link: 'https://github.com/OpenDeepWiki' },
    { titleKey: 'footer.contact', link: 'mailto:239573049@qq.com' },
    { titleKey: 'footer.join', link: 'https://github.com/AIDotNet/OpenDeepWiki/issues' },
  ],
};

// 赞助商配置
const sponsors = [
  {
    name: 'AntSK',
    logo: 'https://antsk.cn/logo.ico',
    url: 'https://antsk.cn/',
    descriptionKey: 'home.sponsors.antsk.description'
  },
  {
    name: '302.AI',
    logo: 'https://302.ai/logo.ico',
    url: 'https://302.ai/',
    descriptionKey: 'home.sponsors.302ai.description'
  }
];

// 特性卡片配置
const features = [
  {
    icon: <RocketOutlined className="text-2xl text-blue-500" />,
    titleKey: 'home.features.fast_conversion.title',
    descriptionKey: 'home.features.fast_conversion.description',
    color: 'blue'
  },
  {
    icon: <CodeOutlined className="text-2xl text-green-500" />,
    titleKey: 'home.features.multi_language.title',
    descriptionKey: 'home.features.multi_language.description',
    color: 'green'
  },
  {
    icon: <BranchesOutlined className="text-2xl text-purple-500" />,
    titleKey: 'home.features.code_structure.title',
    descriptionKey: 'home.features.code_structure.description',
    color: 'purple'
  },
  {
    icon: <FireOutlined className="text-2xl text-orange-500" />,
    titleKey: 'home.features.ai_analysis.title',
    descriptionKey: 'home.features.ai_analysis.description',
    color: 'orange'
  }
];

unstableSetRender((node, container) => {
  // @ts-ignore
  container._reactRoot ||= createRoot(container);
  // @ts-ignore
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});

interface HomeClientProps {
  initialRepositories: Repository[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialSearchValue: string;
}

export default function HomeClient({ initialRepositories, initialTotal, initialPage, initialPageSize, initialSearchValue }: HomeClientProps) {
  // State for repositories
  const [repositories, setRepositories] = useState<Repository[]>(initialRepositories);
  const [total, setTotal] = useState<number>(initialTotal);
  const [formVisible, setFormVisible] = useState(false);
  const [lastRepoModalVisible, setLastRepoModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState<string>(initialSearchValue);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [isMobile, setIsMobile] = useState(false);
  
  // Repository processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'cloning' | 'analyzing' | 'generating' | 'completed'>('cloning');
  const [processingRepoAddress, setProcessingRepoAddress] = useState<string>('');
  const [processingRepo, setProcessingRepo] = useState<Repository | null>(null);

  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();

  // Function to fetch the latest repositories
  const fetchRepositories = async () => {
    try {
      const response = await fetch(`/api/Warehouse/WarehouseList?page=${currentPage}&pageSize=${pageSize}&keyword=${encodeURIComponent(searchValue)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched repositories data:', data);
      
      // Based on the screenshot, we're getting an array in the items property
      // Let's directly use this array
      if (Array.isArray(data.items)) {
        console.log('Using array from data.items:', data.items);
        setRepositories(data.items);
        setTotal(data.items.length);
      } else {
        console.log('Could not find expected array in data.items, data structure:', data);
        // Try to find any array in the response
        let foundArray = false;
        
        // Check if data itself is an array
        if (Array.isArray(data)) {
          console.log('Data itself is an array, using it directly:', data);
          setRepositories(data);
          setTotal(data.length);
          foundArray = true;
        } 
        // Check common properties
        else if (data.data) {
          if (Array.isArray(data.data)) {
            console.log('Using array from data.data:', data.data);
            setRepositories(data.data);
            setTotal(data.data.length);
            foundArray = true;
          } else if (data.data.items && Array.isArray(data.data.items)) {
            console.log('Using array from data.data.items:', data.data.items);
            setRepositories(data.data.items);
            setTotal(data.data.items.length);
            foundArray = true;
          }
        }
        
        // Last resort: search for any array in the response
        if (!foundArray) {
          console.log('Searching for any array in the response');
          for (const key in data) {
            if (Array.isArray(data[key])) {
              console.log(`Found array in property '${key}':`, data[key]);
              setRepositories(data[key]);
              setTotal(data[key].length);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  // Fetch repositories when component mounts and periodically
  useEffect(() => {
    // Initial fetch
    fetchRepositories();
    
    // Set up periodic refresh (every 10 seconds)
    const refreshInterval = setInterval(() => {
      fetchRepositories();
    }, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [currentPage, pageSize, searchValue]);

  // 监听URL参数变化，更新i18n语言
  useEffect(() => {
    const locale = searchParams.get('locale');
    if (locale) {
      i18n.changeLanguage(locale);
    } else {
      const browserLang = navigator.language;
      const lang = browserLang.includes('zh') ? 'zh-CN' : 'en-US';
      i18n.changeLanguage(lang);
    }
  }, [searchParams, i18n]);

  // 检测窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to check repository status
  const checkRepositoryStatus = async (repoAddress: string) => {
    try {
      // Use the same origin to avoid CORS issues
      const response = await fetch(`/api/Warehouse/LastWarehouse?address=${encodeURIComponent(repoAddress)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Repository status data:', data);
      
      return data;
    } catch (error) {
      console.error('Error checking repository status:', error);
      return null;
    }
  };

  // Function to handle repository submission with status checking
  const handleAddRepository = async (values: RepositoryFormValues) => {
    try {
      // Show processing indicator
      setIsProcessing(true);
      setProcessingStep('cloning');
      setProcessingRepoAddress(values.address);
      
      const response = await submitWarehouse(values);
      
      if (response.success) {
        // Start polling for status updates
        let statusInterval = setInterval(async () => {
          const status = await checkRepositoryStatus(values.address);
          
          if (status) {
            // Update processing status based on backend status
            if (status.status === 0) {
              setProcessingStep('cloning');
            } else if (status.status === 1) {
              setProcessingStep('analyzing');
            } else if (status.status === 2) {
              setProcessingStep('completed');
              
              // Stop checking and show success message
              clearInterval(statusInterval);
              
              setTimeout(() => {
                message.success(t('home.messages.repo_add_success'));
                // Fetch repositories instead of reloading the page
                fetchRepositories();
                setIsProcessing(false);
              }, 1500);
            } else if (status.status === 99) {
              // Failed
              clearInterval(statusInterval);
              setIsProcessing(false);
              message.error(t('home.messages.repo_add_failed', { error: status.error || t('home.messages.unknown_error') }));
            }
          } else {
            // If we can't get status, simulate progress
            // This ensures a good UX even if the backend status check fails
            if (processingStep === 'cloning') {
              setTimeout(() => setProcessingStep('analyzing'), 5000);
            } else if (processingStep === 'analyzing') {
              setTimeout(() => setProcessingStep('generating'), 5000);
            } else if (processingStep === 'generating') {
              setTimeout(() => {
                setProcessingStep('completed');
                clearInterval(statusInterval);
                
                setTimeout(() => {
                  message.success(t('home.messages.repo_add_success'));
                  // Fetch repositories instead of reloading the page
                  fetchRepositories();
                  setIsProcessing(false);
                }, 1500);
              }, 5000);
            }
          }
        }, 3000);
        
      } else {
        setIsProcessing(false);
        message.error(t('home.messages.repo_add_failed', { error: response.error || t('home.messages.unknown_error') }));
      }
    } catch (error) {
      console.error('添加仓库出错:', error);
      setIsProcessing(false);
      message.error(t('home.messages.repo_add_error'));
    }
    setFormVisible(false);
  };

  const handleLastRepoQuery = () => {
    setLastRepoModalVisible(true);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
    // Keep the current page size
    // Fetch repositories with the new search value
    setTimeout(() => fetchRepositories(), 0);
  };

  // 计算统计数据
  const stats = {
    totalRepositories: initialTotal || repositories.length,
  };

  return (
    <ConfigProvider theme={modernTheme}>
      <style jsx global>{`
        /* 光晕动画效果 */
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.15), 0 0 40px rgba(37, 99, 235, 0.08);
          }
          50% {
            box-shadow: 0 0 30px rgba(37, 99, 235, 0.25), 0 0 60px rgba(37, 99, 235, 0.12);
          }
        }

        @keyframes hero-glow {
          0%, 100% {
            background: radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
          }
          50% {
            background: radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 英雄区域光晕背景 */
        .hero-glow {
          overflow: hidden;
        }

        .hero-glow::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
          animation: hero-glow 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          animation: fadeInUp 0.8s ease-out;
        }

        /* Logo浮动效果 */
        .hero-content .ant-avatar {
          animation: float 3s ease-in-out infinite;
        }

        /* 统计卡片光晕效果 */
        .stat-card {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 25px rgba(37, 99, 235, 0.15), 0 8px 32px rgba(0, 0, 0, 0.12);
          border-color: rgba(37, 99, 235, 0.2);
        }

        /* 特性卡片动画 */
        .hero-content .ant-card {
          animation: fadeInUp 0.8s ease-out;
          animation-fill-mode: both;
        }

        .hero-content .ant-card:nth-child(1) { animation-delay: 0.1s; }
        .hero-content .ant-card:nth-child(2) { animation-delay: 0.2s; }
        .hero-content .ant-card:nth-child(3) { animation-delay: 0.3s; }
        .hero-content .ant-card:nth-child(4) { animation-delay: 0.4s; }

        /* 主按钮光晕效果 */
        .glow-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glow-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .glow-button:hover::before {
          left: 100%;
        }

        .glow-button:hover {
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.4), 0 0 40px rgba(37, 99, 235, 0.2);
          transform: translateY(-2px);
        }

        /* 搜索框光晕效果 */
        .search-glow .ant-input-affix-wrapper {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }

        .search-glow .ant-input-affix-wrapper:hover,
        .search-glow .ant-input-affix-wrapper:focus,
        .search-glow .ant-input-affix-wrapper-focused {
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.15), 0 4px 20px rgba(0, 0, 0, 0.08);
          border-color: rgba(37, 99, 235, 0.3);
        }

        /* 页脚链接光晕效果 */
        .footer-link {
          position: relative;
          transition: all 0.3s ease;
        }

        .footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          transition: width 0.3s ease;
        }

        .footer-link:hover::after {
          width: 100%;
        }

        .footer-link:hover {
          color: #2563eb !important;
          text-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
        }

        /* 赞助商卡片悬停效果 */
        .sponsor-card {
          transition: all 0.3s ease;
          border-radius: 12px;
        }

        .sponsor-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        /* 响应式动画优化 */
        @media (prefers-reduced-motion: reduce) {
          .stat-card,
          .glow-button,
          .search-glow .ant-input-affix-wrapper,
          .footer-link,
          .hero-content .ant-avatar {
            transition: none;
            animation: none;
          }
          
          .hero-glow::before {
            animation: none;
          }
        }

        @media (max-width: 768px) {
          .stat-card:hover {
            transform: translateY(-2px);
          }
          
          .glow-button:hover {
            transform: translateY(-1px);
          }

          .hero-content .ant-avatar {
            animation-duration: 4s;
          }
        }

        /* 滚动条美化 */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <Layout className="min-h-screen bg-slate-50">
        {/* 现代化头部 */}
        <Header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
            <div className="flex items-center space-x-3">
              <Avatar
                src="/logo.png"
                size={40}
                className="shadow-sm"
              />
              <Title style={{
                marginTop: 8,
                fontWeight: 600,
              }} level={3} className="m-0 text-slate-800 font-semibold">
                OpenDeepWiki
              </Title>
            </div>

            <Space size="middle" align="center">
              <LanguageSwitcher />
              <Button
                type="text"
                icon={<GithubOutlined />}
                href={homepage}
                target="_blank"
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                size="large"
              />
            </Space>
          </div>
        </Header>

        <Content className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div  className="hero-glow text-center mb-20">
              <div className="hero-content max-w-4xl mx-auto">
                <Title level={1} className="text-slate-900 mb-6 font-bold text-4xl lg:text-5xl">
                  {t('home.title')}
                </Title>

                <Paragraph className="text-xl lg:text-2xl text-slate-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                  {t('home.subtitle')}
                </Paragraph>

                <div className="mb-12">
                  <Space size="large" wrap className="justify-center">
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={() => setFormVisible(true)}
                      className="glow-button h-14 px-10 text-lg font-medium"
                    >
                      {t('home.add_repo_button')}
                    </Button>
                    <Button
                      size="large"
                      onClick={handleLastRepoQuery}
                      className="h-14 px-10 text-lg font-medium border-2"
                    >
                      {t('home.query_last_repo_button')}
                    </Button>
                  </Space>
                </div>
              </div>
            </div>


            {/* 仓库列表区域 */}
            <Card className="border-0 shadow-sm bg-white/90 backdrop-blur-md">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-3">
                  <Tag color="blue" className="px-3 py-1 text-sm font-medium">
                    <RocketOutlined className="mr-1" />
                    {t('home.repo_list.title')}
                  </Tag>
                  <Text className="text-slate-500">
                    {t('home.repo_list.total', { count: stats.totalRepositories })}
                  </Text>
                </div>

                <Space size="middle" wrap>
                  <div className="search-glow">
                    <Search
                      placeholder={t('home.repo_list.search_placeholder')}
                      allowClear
                      value={searchValue}
                      onSearch={handleSearch}
                      onChange={e => setSearchValue(e.target.value)}
                      className="w-80"
                      size="large"
                    />
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setFormVisible(true)}
                    size="large"
                    className="glow-button font-medium"
                  >
                    {t('home.repo_list.add_button')}
                  </Button>
                </Space>
              </div>

              {repositories.length === 0 ? (
                <div className="text-center py-16">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Text className="text-slate-500 text-base">
                        {searchValue ? t('home.repo_list.not_found', { keyword: searchValue }) : t('home.repo_list.empty')}
                      </Text>
                    }
                  >
                    <Button
                      type="primary"
                      onClick={() => setFormVisible(true)}
                      size="large"
                      icon={<PlusOutlined />}
                      className="glow-button mt-4"
                    >
                      {t('home.repo_list.add_now')}
                    </Button>
                  </Empty>
                </div>
              ) : (
                <>
                  {/* Add debugging component to show raw data */}
                  <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h3>Debug: Repository Data</h3>
                    <p>Repositories count: {repositories.length}</p>
                    <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                      <pre style={{ fontSize: '12px' }}>{JSON.stringify(repositories, null, 2)}</pre>
                    </div>
                  </div>
                  
                  <RepositoryList repositories={repositories} />
                  {total > pageSize && (
                    <div className="text-center mt-8 pt-6 border-t border-slate-100">
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={total}
                        onChange={(page, size) => {
                          setCurrentPage(page);
                          if (size !== pageSize) {
                            setPageSize(size);
                          }
                          // Fetch repositories with new pagination
                          fetchRepositories();
                        }}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total) => t('home.pagination.total', { total })}
                        className="font-medium"
                      />
                    </div>
                  )}
                </>
              )}
            </Card>

            <RepositoryForm
              open={formVisible}
              onCancel={() => setFormVisible(false)}
              onSubmit={handleAddRepository}
            />

            <LastRepoModal
              open={lastRepoModalVisible}
              onCancel={() => setLastRepoModalVisible(false)}
            />
            
            {/* Processing indicator for repository submission */}
            {isProcessing && (
              <ProcessingIndicator 
                visible={isProcessing} 
                step={processingStep}
                repoAddress={processingRepoAddress}
                repoStatus={processingRepo?.status}
              />
            )}
          </div>
        </Content>

        {/* 现代化页脚 */}
        <Footer className="bg-white/90 backdrop-blur-md border-t border-slate-200 mt-16">
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* 赞助商区域 */}
            <div className="text-center mb-12">
              <Title level={4} className="text-slate-800 mb-6">
                {t('home.sponsors.title')}
              </Title>
              <Row gutter={[32, 16]} justify="center">
                {sponsors.map((sponsor, index) => (
                  <Col key={index}>
                    <a
                      href={sponsor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-lg hover:bg-slate-50 transition-colors duration-300"
                    >
                      <Space direction="vertical" align="center" size="small">
                        <Avatar
                          src={sponsor.logo}
                          size={48}
                          className="shadow-sm"
                        />
                        <div className="text-center">
                          <Text className="font-medium text-slate-800 block">
                            {sponsor.name}
                          </Text>
                          <Text className="text-slate-500 text-xs">
                            {t(sponsor.descriptionKey)}
                          </Text>
                        </div>
                      </Space>
                    </a>
                  </Col>
                ))}
              </Row>
            </div>

            <Divider className="my-8 border-slate-200" />

            <Row gutter={[48, 32]}>
              <Col xs={24} lg={8}>
                <div className="mb-6">
                  <Space align="center" className="mb-4">
                    <Avatar src="/logo.png" size={32} />
                    <Title level={4} className="m-0 text-slate-800">
                      OpenDeepWiki
                    </Title>
                  </Space>
                  <Paragraph className="text-slate-600 mb-6 max-w-sm">
                    {t('description')}
                  </Paragraph>
                  <Space size="middle">
                    <Button
                      type="text"
                      icon={<GithubOutlined />}
                      href={homepage}
                      target="_blank"
                      className="text-slate-500 hover:text-slate-700 p-0"
                    />
                    <Tag color="blue" className="px-3 py-1">
                      .NET 9.0
                    </Tag>
                    <Tag color="green" className="px-3 py-1">
                      {t('home.tags.open_source')}
                    </Tag>
                  </Space>
                </div>
              </Col>

              <Col xs={24} lg={16}>
                <Row gutter={[32, 24]}>
                  <Col xs={12} sm={8}>
                    <Title level={5} className="text-slate-800 mb-4">
                      {t('footer.product')}
                    </Title>
                    <Space direction="vertical" size="small">
                      {footerLinks.product.map(link => (
                        <a key={link.titleKey} href={link.link} className="footer-link text-slate-600 block">
                          {t(link.titleKey)}
                        </a>
                      ))}
                    </Space>
                  </Col>

                  <Col xs={12} sm={8}>
                    <Title level={5} className="text-slate-800 mb-4">
                      {t('footer.resources')}
                    </Title>
                    <Space direction="vertical" size="small">
                      {footerLinks.resources.map(link => (
                        <a key={link.titleKey} href={link.link} className="footer-link text-slate-600 block">
                          {t(link.titleKey)}
                        </a>
                      ))}
                    </Space>
                  </Col>

                  <Col xs={12} sm={8}>
                    <Title level={5} className="text-slate-800 mb-4">
                      {t('footer.company')}
                    </Title>
                    <Space direction="vertical" size="small">
                      {footerLinks.company.map(link => (
                        <a key={link.titleKey} href={link.link} className="footer-link text-slate-600 block">
                          {t(link.titleKey)}
                        </a>
                      ))}
                    </Space>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Divider className="my-8 border-slate-200" />

            <Row justify="space-between" align="middle" gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Space direction="vertical" size={2}>
                  <Text className="text-slate-500 text-sm">
                    {t('footer.copyright', { year: new Date().getFullYear() })}
                  </Text>
                  <Text className="text-slate-500 text-sm">
                    {t('footer.powered_by')} <span className="text-blue-600 font-medium">.NET 9.0</span> & <span className="text-green-600 font-medium">Semantic Kernel</span>
                  </Text>
                </Space>
              </Col>

              <Col xs={24} sm={12} className="text-left sm:text-right">
                <Space split={<Divider type="vertical" className="border-slate-300" />}>
                  <a href="/privacy" className="footer-link text-slate-500 text-sm">
                    {t('footer.privacy')}
                  </a>
                  <a href="/terms" className="footer-link text-slate-500 text-sm">
                    {t('footer.terms')}
                  </a>
                  <Text className="text-slate-400 text-sm">
                    v2.0.0
                  </Text>
                </Space>
              </Col>
            </Row>
          </div>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
} 