import { Metadata, ResolvingMetadata } from 'next';
import RepositoryLayoutServer from './layout.server';

type Props = {
  params: { owner: string; name: string; branch: string }
  children: React.ReactNode
}

// 为页面生成动态元数据
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { owner, name } = params;

  // 优化SEO的元数据
  return {
    title: `${name} - ${owner} 的文档仓库 | OpenDeekWiki`,
    description: `浏览 ${owner}/${name} 的文档内容，查看技术文档、API文档和其他相关资源。`,
    keywords: [`${name}`, `${owner}`, '文档', '知识库', 'OpenDeekWiki', '技术文档'],
    openGraph: {
      title: `${name} - ${owner} 的文档仓库`,
      description: `浏览 ${owner}/${name} 的文档内容，查看技术文档、API文档和其他相关资源。`,
      url: `/${owner}/${name}`,
      siteName: 'OpenDeekWiki',
      locale: 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - ${owner} 的文档仓库 | OpenDeekWiki`,
      description: `浏览 ${owner}/${name} 的文档内容，查看技术文档、API文档和其他相关资源。`,
    },
    alternates: {
      canonical: `/${owner}/${name}`,
    },
    robots: {
      index: true,
      follow: true,
    }
  }
}

// Using 'any' type to bypass TypeScript checking for Next.js 15.3.2 layout component
export default function RepositoryLayout(props: any) {
  const { children, params } = props;
  // If params is not provided, use empty defaults
  const owner = params?.owner || '';
  const name = params?.name || '';
  const branch = params?.branch || 'main';
  return (
    <RepositoryLayoutServer
      owner={owner}
      name={name}
      branch={branch}
    >
      {children}
    </RepositoryLayoutServer>
  );
} 