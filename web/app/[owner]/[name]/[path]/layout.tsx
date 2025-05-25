import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { documentById } from '../../../services/warehouseService';
import Script from 'next/script';

// 获取文档内容以生成更精确的SEO元数据
async function getDocument(owner: string, name: string, path: string) {
  try {
    const response = await documentById(owner, name, path);
    if (response?.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('获取文档内容失败:', error);
    return null;
  }
}

// 为页面生成动态元数据
export async function generateMetadata(
  { params }: any,
  parent: any
): Promise<Metadata> {
  const { owner, name, path } = params;
  const pathString = Array.isArray(path) ? path.join('/') : path;
  
  // 尝试获取文档内容以提取更好的描述
  const document = await getDocument(owner, name, pathString);
  const title = document?.title || pathString;
  
  // 从文档内容中提取前200个字符作为描述
  let description = `${owner}/${name} 仓库中 ${pathString} 的文档内容`;
  if (document?.content) {
    // 移除Markdown标记以获取纯文本
    const plainText = document.content
      .replace(/#+\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n/g, ' ')
      .trim();
    description = plainText.length > 200 
      ? `${plainText.substring(0, 197)}...` 
      : plainText;
  }

  // 生成关键词（包括标题、作者、仓库名等）
  const keywords = [
    title, 
    owner, 
    name, 
    '文档', 
    '知识库', 
    'API', 
    'OpenDeepWiki',
    ...(document?.tags || [])
  ].filter(Boolean);

  return {
    title: `${title} - ${owner}/${name} | OpenDeepWiki`,
    description,
    keywords,
    authors: [{ name: owner }],
    creator: owner,
    publisher: 'OpenDeepWiki',
    openGraph: {
      title: `${title} - ${owner}/${name}`,
      description,
      url: `/${owner}/${name}/${pathString}`,
      siteName: 'OpenDeepWiki',
      locale: 'zh_CN',
      type: 'article',
      authors: [owner],
      publishedTime: document?.createTime,
      modifiedTime: document?.updateTime,
    },
    twitter: {
      card: 'summary',
      title: `${title} - ${owner}/${name} | OpenDeepWiki`,
      description,
      creator: owner,
    },
    alternates: {
      canonical: `/${owner}/${name}/${pathString}`,
    }
  }
}

import React from 'react';

// Using 'any' type to bypass TypeScript checking for Next.js 15.3.2 layout component
export default function DocumentLayout(props: any) {
  const { children, params } = props;
  // If params is not provided, use empty defaults
  const owner = params?.owner || '';
  const name = params?.name || '';
  const path = params?.path || [];
  const pathString = Array.isArray(path) ? path.join('/') : path;
  
  // 构建结构化数据
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': `${path} - ${owner}/${name}`,
    'description': `${owner}/${name} 仓库中 ${pathString} 的文档内容`,
    'author': {
      '@type': 'Person',
      'name': owner
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'OpenDeepWiki',
      'logo': {
        '@type': 'ImageObject',
        'url': '/logo.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `/${owner}/${name}/${pathString}`
    }
  };

  return (
    <>
      {/* 添加结构化数据 */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* 语义化文档结构 */}
      <article className="wiki-document" itemScope itemType="https://schema.org/TechArticle">
        <meta itemProp="author" content={owner} />
        <meta itemProp="name" content={`${path} - ${owner}/${name}`} />
        {children}
      </article>
    </>
  );
} 