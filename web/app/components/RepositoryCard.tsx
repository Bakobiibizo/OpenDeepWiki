import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Repository } from '../types';
import {
  FileOutlined,
  ClockCircleOutlined,
  GithubOutlined,
  StarOutlined,
  ForkOutlined,
  EyeOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { Card, Tag, Tooltip, Avatar, Typography, Space, Button } from 'antd';
import Link from 'next/link';
import { useTranslation } from '../i18n/client';

const { Text, Title } = Typography;

interface RepositoryCardProps {
  repository: Repository;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  // Add debugging to see what repository data we're receiving
  console.log('RepositoryCard received repository:', repository);

  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Extract repository name from address if name is missing
  const getRepositoryName = () => {
    if (repository.name) return repository.name;
    
    if (repository.address) {
      try {
        // Extract repo name from GitHub URL: https://github.com/username/repo-name
        const urlParts = repository.address.split('/');
        return urlParts[urlParts.length - 1].replace('.git', '');
      } catch (e) {
        return 'Unknown Repository';
      }
    }
    
    return 'Unknown Repository';
  };
  
  // Get repository status with fallback
  const getRepositoryStatus = () => {
    if (repository.status !== undefined) return repository.status;
    return 0; // Default to pending
  };

  // 鼠标移动事件处理
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // 根据地址获取头像
  const getAvatarUrl = () => {
    if (repository?.avatarUrl) {
      return repository.avatarUrl;
    }

    if (repository.address?.includes('github.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://github.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitee.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitee.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitea.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitea.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitlab.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitlab.com/${owner}.png`;
      }
    }
    return null;
  };

  const avatarUrl = useMemo(() => getAvatarUrl(), [repository.address, repository.organizationName]);

  const getStatusNumber = (status: string | number): number => {
    if (typeof status === 'number') return status;
    return parseInt(status, 10) || 0;
  };

  // 获取状态配置
  const statusConfig = useMemo(() => {
    let status = getRepositoryStatus();
    if (typeof status === 'string') {
      status = parseInt(status, 10);
    }

    switch (status) {
      case 0: return { color: 'orange', text: t('repository.status.pending', '待处理') };
      case 1: return { color: 'blue', text: t('repository.status.processing', '处理中') };
      case 2: return { color: 'green', text: t('repository.status.completed', '已完成') };
      case 3: return { color: 'default', text: t('repository.status.cancelled', '已取消') };
      case 4: return { color: 'purple', text: t('repository.status.unauthorized', '未授权') };
      case 99: return { color: 'red', text: t('repository.status.failed', '已失败') };
      default: return { color: 'default', text: t('repository.status.unknown', '未知状态') };
    }
  }, [repository, t]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRepoIcon = () => {
    if (repository.address?.includes('github.com')) {
      return <GithubOutlined className="text-slate-600" />;
    } else if (repository.address?.includes('gitee.com')) {
      return <span className="text-red-500 font-bold text-sm">G</span>;
    } else {
      return <FileOutlined className="text-slate-600" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num > 999) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // We're now using the statusConfig from the useMemo above

  const handleCardClick = () => {
    window.location.href = `/${repository.organizationName}/${repository.name}`;
  };

  return (
    <>
      <style jsx>{`
        .repo-card {
          border-radius: 12px;
          position: relative;
          height: 280px; /* 设置卡片固定高度 */
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
        }

        .repo-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(37, 99, 235, 0.08) 0%, 
            rgba(59, 130, 246, 0.04) 50%, 
            rgba(147, 197, 253, 0.02) 100%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 1;
        }

        .repo-card::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, 
            rgba(37, 99, 235, 0.2), 
            rgba(59, 130, 246, 0.15), 
            rgba(147, 197, 253, 0.1),
            rgba(37, 99, 235, 0.2)
          );
          background-size: 300% 300%;
          border-radius: 12px;
          opacity: 0;
          animation: gradient-shift 3s ease infinite;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 0;
        }

        /* 鼠标跟随光晕效果 */
        .mouse-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, 
            rgba(37, 99, 235, 0.15) 0%, 
            rgba(59, 130, 246, 0.1) 30%, 
            rgba(147, 197, 253, 0.05) 60%, 
            transparent 100%
          );
          pointer-events: none;
          z-index: 1;
          transition: opacity 0.3s ease;
          transform: translate(-50%, -50%);
        }

        .mouse-glow.active {
          opacity: 1;
        }

        .mouse-glow.inactive {
          opacity: 0;
        }

        /* 鼠标跟随光点 */
        .mouse-spotlight {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, 
            rgba(37, 99, 235, 0.2) 0%, 
            rgba(59, 130, 246, 0.1) 40%, 
            transparent 70%
          );
          pointer-events: none;
          z-index: 2;
          transition: opacity 0.2s ease;
          transform: translate(-50%, -50%);
          filter: blur(1px);
        }

        .mouse-spotlight.active {
          opacity: 1;
        }

        .mouse-spotlight.inactive {
          opacity: 0;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .repo-card:hover::before {
          opacity: 1;
        }

        .repo-card:hover::after {
          opacity: 1;
        }


        .repo-card-content {
          position: relative;
          z-index: 3;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .repo-header {
          padding: 16px;
          height: 80px; /* 设置固定高度 */
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          background: rgba(248, 250, 252, 0.5);
        }

        .repo-body {
          padding: 16px;
          height: 140px; /* 调整描述区域高度 */
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .description-container {
          width: 100%;
          max-height: 100%;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .repo-footer {
          padding: 12px 16px;
          height: 60px; /* 设置固定高度 */
          background: rgba(248, 250, 252, 0.8);
          border-top: 1px solid rgba(226, 232, 240, 0.6);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
        }

        .avatar-glow {
          position: relative;
          transition: all 0.3s ease;
        }

        .avatar-glow::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, rgba(37, 99, 235, 0.3), rgba(59, 130, 246, 0.2));
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .repo-card:hover .avatar-glow::before {
          opacity: 1;
        }

        .status-tag {
          position: relative;
          overflow: hidden;
        }

        .status-tag::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
        }

        .repo-card:hover .status-tag::before {
          left: 100%;
        }

        .stat-item {
          transition: all 0.3s ease;
        }

        .repo-card:hover .stat-item {
          transform: scale(1.05);
        }

        /* 响应式优化 */
        @media (max-width: 768px) {
          .repo-card:hover {
            transform: translateY(-2px) scale(1.01);
          }
          
          .mouse-glow,
          .mouse-spotlight {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .repo-card,
          .avatar-glow,
          .status-tag,
          .stat-item,
          .mouse-glow,
          .mouse-spotlight {
            transition: none;
          }
          
          .repo-card::after {
            animation: none;
          }
        }
      `}</style>

      <div
        ref={cardRef}
        className="repo-card"
        onClick={handleCardClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 鼠标跟随光晕 */}
        <div
          className={`mouse-glow ${isHovered ? 'active' : 'inactive'}`}
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
          }}
        />

        {/* 鼠标跟随光点 */}
        <div
          className={`mouse-spotlight ${isHovered ? 'active' : 'inactive'}`}
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
          }}
        />

        <Card
          style={{
            height: '100%', 
            border: 'none', background: 'transparent',
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div className="repo-card-content">
            {/* 卡片头部 */}
            <div className="repo-header">
              <div className="flex items-start space-x-3">
                <div className="avatar-glow">
                  <Avatar
                    src={avatarUrl}
                    icon={<FileOutlined />}
                    size={40}
                    className="flex-shrink-0 shadow-sm"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <Title level={5} className="m-0 text-slate-800 truncate font-semibold" title={getRepositoryName()}>
                      {getRepositoryName()}
                    </Title>
                    <div className="text-lg">
                      {getRepoIcon()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Tag color={statusConfig.color} className="status-tag text-xs px-2 py-0.5 font-medium">
                      {statusConfig.text}
                    </Tag>
                    {repository.isRecommended && (
                      <Tag color="pink" className="status-tag text-xs px-2 py-0.5 font-medium">
                        推荐
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片内容 */}
            <div className="repo-body">
              <div className="description-container">
                <Text className="text-slate-600 text-sm leading-relaxed block w-full">
                  {repository.description || '暂无描述'}
                </Text>
              </div>
              
              {/* Add View Wiki button for completed repositories */}
              {getRepositoryStatus() === 2 && (
                <div className="mt-4 flex justify-center">
                  <Link href={`/wiki?address=${encodeURIComponent(repository.address)}`} passHref>
                    <Button 
                      type="primary" 
                      icon={<BookOutlined />} 
                      size="middle"
                      className="w-full"
                    >
                      {t('repository.view_wiki', 'View Wiki')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* 卡片底部 */}
            <div className="repo-footer">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <Tooltip title="创建时间">
                    <div className="stat-item flex items-center space-x-1">
                      <ClockCircleOutlined />
                      <span>{formatDate(repository.createdAt)}</span>
                    </div>
                  </Tooltip>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  {repository.stars > 0 && (
                    <Tooltip title={`${repository.stars} Stars`}>
                      <div className="stat-item flex items-center space-x-1">
                        <StarOutlined className="text-yellow-500" />
                        <span>{formatNumber(repository.stars)}</span>
                      </div>
                    </Tooltip>
                  )}

                  {repository?.forks > 0 && (
                    <Tooltip title={`${repository.forks} Forks`}>
                      <div className="stat-item flex items-center space-x-1">
                        <ForkOutlined />
                        <span>{formatNumber(repository.forks)}</span>
                      </div>
                    </Tooltip>
                  )}

                  {repository?.language && (
                    <Tooltip title={`主要语言: ${repository.language}`}>
                      <div className="stat-item flex items-center space-x-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="max-w-16 truncate">{repository.language}</span>
                      </div>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default RepositoryCard; 