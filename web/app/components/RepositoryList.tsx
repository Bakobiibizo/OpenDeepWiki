import { Col, Empty, Row, Card, Typography, Button, Tag } from 'antd';
import { Repository } from '../types';
import RepositoryCard from './RepositoryCard';
import { useTranslation } from '../i18n/client';
import Link from 'next/link';
import { BookOutlined } from '@ant-design/icons';

interface RepositoryListProps {
  repositories: Repository[];
}

const RepositoryList: React.FC<RepositoryListProps> = ({ repositories }) => {
  const { t } = useTranslation();
  
  // Add debugging to see what repositories data is being received
  console.log('RepositoryList received repositories:', repositories);
  
  if (!repositories || !repositories.length) {
    console.log('No repositories to display');
    return <Empty description={t('home.repo_list.empty')} />;
  }

  // Create a direct fallback rendering of repositories
  return (
    <div className="repository-grid">
      <Row gutter={[32, 32]}>
        {repositories.map((repository, index) => {
          // Use index as key if id is not available
          const key = repository.id || `repo-${index}`;
          
          // Try to extract repository name from address if name is missing
          const name = repository.name || (
            repository.address ? 
              repository.address.split('/').pop()?.replace('.git', '') : 
              `Repository ${index + 1}`
          );
          
          // Determine if repository is completed (status === 2)
          const isCompleted = repository.status === 2;
          
          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={key}>
              <Card
                title={name}
                style={{ height: '100%' }}
                extra={<Tag color={isCompleted ? 'success' : 'processing'}>
                  {isCompleted ? 'Completed' : 'Processing'}
                </Tag>}
              >
                <Typography.Paragraph ellipsis={{ rows: 2 }}>
                  {repository.description || 'No description available'}
                </Typography.Paragraph>
                
                {repository.address && (
                  <Typography.Paragraph type="secondary" ellipsis>
                    {repository.address}
                  </Typography.Paragraph>
                )}
                
                {isCompleted && repository.address && (
                  <Link href={`/wiki?address=${encodeURIComponent(repository.address)}`} passHref>
                    <Button type="primary" icon={<BookOutlined />} style={{ width: '100%', marginTop: '10px' }}>
                      View Wiki
                    </Button>
                  </Link>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default RepositoryList; 