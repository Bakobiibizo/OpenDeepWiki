'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Spin, Typography, Card, Breadcrumb, Alert, Button, Space, Tabs, Collapse, Menu } from 'antd'
import { HomeOutlined, BookOutlined, GithubOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { documentCatalog, getLastWarehouse, getDocumentFileItems } from '../services/warehouseService'
import ReactMarkdown from 'react-markdown'

const { Title, Paragraph, Text } = Typography

// Client component that uses searchParams
function WikiContent() {
  const searchParams = useSearchParams()
  const address = searchParams.get('address')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wikiData, setWikiData] = useState<any>(null)
  const [fileItems, setFileItems] = useState<any[]>([])
  const [repoName, setRepoName] = useState<string>('')  
  const [activeSection, setActiveSection] = useState<string | null>(null)
  
  useEffect(() => {
    if (!address) {
      setError('Repository address is required')
      setLoading(false)
      return
    }
    
    // Extract repository name from address
    try {
      const urlParts = address.split('/')
      const name = urlParts[urlParts.length - 1].replace('.git', '')
      setRepoName(name)
    } catch (e) {
      console.error('Error extracting repo name:', e)
      setRepoName('Repository')
    }
    
    const fetchWikiData = async () => {
      try {
        setLoading(true)
        
        if (!address) {
          throw new Error('Repository address is required')
        }
        
        // Extract owner and repo name from address for API call
        const urlObj = new URL(address);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        const owner = pathParts[0];
        const repo = pathParts[1]?.replace('.git', '');
        
        if (!owner || !repo) {
          throw new Error('Invalid repository address format');
        }
        
        // First check if the repository exists and is processed
        const repoResponse = await getLastWarehouse(address);
        
        if (!repoResponse.success) {
          throw new Error(`Failed to fetch repository status: ${repoResponse.message || 'Unknown error'}`);
        }
        
        const repoData = repoResponse.data;
        
        if (!repoData || repoData.status !== 2) {
          setError('Repository is not yet processed or does not exist');
          setLoading(false);
          return;
        }
        
        // Now fetch the wiki content using the documentCatalog function
        const wikiResponse = await documentCatalog(owner, repo);
        
        if (!wikiResponse.success) {
          throw new Error(`Failed to fetch wiki content: ${wikiResponse.message || 'Unknown error'}`)
        }
        
        setWikiData(wikiResponse.data)
        
        // Fetch document file items (actual content)
        const fileItemsResponse = await getDocumentFileItems(owner, repo);
        
        if (fileItemsResponse.success) {
          console.log('File items response:', fileItemsResponse);
          
          // Make sure we have the data array
          let items = fileItemsResponse.data;
          if (items && items.data && Array.isArray(items.data)) {
            items = items.data;
          }
          
          console.log('Processed items:', items);
          setFileItems(Array.isArray(items) ? items : []);
          
          // Set the first section as active by default if available
          if (wikiResponse.data?.items && wikiResponse.data.items.length > 0) {
            const firstKey = wikiResponse.data.items[0].key;
            console.log('Setting active section to first item:', firstKey);
            setActiveSection(firstKey);
          }
        } else {
          console.warn('Failed to fetch document file items:', fileItemsResponse.message);
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching wiki data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load wiki content')
        setLoading(false)
      }
    }
    
    fetchWikiData()
  }, [address])
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading wiki content..." />
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <Breadcrumb items={[
          { title: <Link href="/"><HomeOutlined /> Home</Link> },
          { title: <span><BookOutlined /> Wiki</span> }
        ]} style={{ marginBottom: '20px' }} />
        
        <Alert
          message="Error Loading Wiki"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Space>
          <Link href="/" passHref>
            <Button type="primary">Return Home</Button>
          </Link>
          
          {address && (
            <Button 
              icon={<GithubOutlined />}
              href={address}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </Button>
          )}
        </Space>
      </div>
    )
  }
  
  // Function to find content for a section based on documentCatalogId
  const getContentForSection = (sectionKey: string) => {
    if (!sectionKey || !fileItems || fileItems.length === 0) {
      return null;
    }
    
    // Direct match by documentCatalogId
    return fileItems.find(item => item.documentCatalogId === sectionKey);
  };
  
  // Function to render menu items recursively
  const renderMenuItems = (items: any[]) => {
    return items.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <Menu.SubMenu 
            key={item.key} 
            title={item.label}
            onTitleClick={() => {
              console.log('Submenu clicked:', item.key);
              setActiveSection(item.key);
            }}
          >
            {renderMenuItems(item.children)}
          </Menu.SubMenu>
        );
      }
      return (
        <Menu.Item 
          key={item.key} 
          onClick={() => {
            console.log('Menu item clicked:', item.key);
            setActiveSection(item.key);
          }}
        >
          {item.label}
        </Menu.Item>
      );
    });
  };

  // Function to render content for a section
  const renderSectionContent = (sectionKey: string) => {
    // Find section info in wiki structure
    const findSectionInfo = (items: any[]): any => {
      for (const item of items) {
        if (item.key === sectionKey) {
          return item;
        }
        if (item.children) {
          const found = item.children.find((child: any) => child.key === sectionKey);
          if (found) return found;
        }
      }
      return null;
    };
    
    const sectionInfo = findSectionInfo(wikiData?.items || []);
    if (!sectionInfo) {
      return (
        <Alert
          message="Section Not Found"
          description="The selected section could not be found in the wiki structure."
          type="error"
          showIcon
        />
      );
    }
    
    // Find matching content
    const contentItem = getContentForSection(sectionInfo.key);
    
    if (contentItem) {
      return (
        <div className="section-content">
          <Title level={3}>{sectionInfo.label}</Title>
          <div className="markdown-content">
            <ReactMarkdown>
              {contentItem.content}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
    
    // If no content found, display all available content items
    return (
      <div>
        <Title level={3}>{sectionInfo.label}</Title>
        <Alert
          message="Content Not Found"
          description={
            <div>
              <p>No content found for this section. Here are all available content items:</p>
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {fileItems.map((item, index) => (
                  <Card 
                    key={index} 
                    title={item.title} 
                    style={{ marginBottom: '10px' }}
                    extra={
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => {
                          // Force display this content
                          const contentDiv = document.getElementById('content-display');
                          if (contentDiv) {
                            contentDiv.innerHTML = `
                              <h3>${item.title}</h3>
                              <div>${item.content}</div>
                            `;
                          }
                        }}
                      >
                        Show Content
                      </Button>
                    }
                  >
                    <p><strong>ID:</strong> {item.id}</p>
                    <p><strong>Document Catalog ID:</strong> {item.documentCatalogId}</p>
                  </Card>
                ))}
              </div>
              <div id="content-display" style={{ marginTop: '20px' }}></div>
            </div>
          }
          type="info"
          showIcon
        />
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      <Breadcrumb items={[
        { title: <Link href="/"><HomeOutlined /> Home</Link> },
        { title: <span><BookOutlined /> {repoName} Wiki</span> }
      ]} style={{ marginBottom: '20px' }} />
      
      <Card>
        <Title level={2}>{repoName} Documentation</Title>
        
        {wikiData ? (
          <div className="wiki-content" style={{ display: 'flex' }}>
            {/* Navigation sidebar */}
            <div style={{ width: '250px', borderRight: '1px solid #f0f0f0', paddingRight: '20px', marginRight: '20px' }}>
              <Title level={4}>Contents</Title>
              
              {wikiData.items && wikiData.items.length > 0 ? (
                <Menu
                  mode="inline"
                  selectedKeys={activeSection ? [activeSection] : []}
                  style={{ borderRight: 0 }}
                  defaultOpenKeys={wikiData.items.map((item: any) => item.key)}
                >
                  {renderMenuItems(wikiData.items)}
                </Menu>
              ) : (
                <Alert message="No content structure found" type="info" />
              )}
            </div>
            
            {/* Main content area */}
            <div style={{ flex: 1, padding: '10px' }}>
              {activeSection ? (
                renderSectionContent(activeSection)
              ) : (
                <Alert
                  message="Select a Section"
                  description="Please select a section from the navigation sidebar to view its content."
                  type="info"
                  showIcon
                />
              )}
            </div>
          </div>
        ) : (
          <Alert
            message="No Wiki Content"
            description="No wiki content was found for this repository. It may still be in the process of being generated."
            type="warning"
            showIcon
          />
        )}
        
        {/* Repository info */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
          <Space>
            <Link href="/" passHref>
              <Button type="primary">Return Home</Button>
            </Link>
            
            {wikiData && wikiData.git && (
              <Button 
                icon={<GithubOutlined />}
                href={wikiData.git}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </Button>
            )}
          </Space>
        </div>
        
        {/* Debug information */}
        <div style={{ marginTop: '30px' }}>
          <Collapse>
            <Collapse.Panel header="Debug Information" key="1">
              <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="Wiki Structure" key="1">
                  <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {JSON.stringify(wikiData, null, 2)}
                  </pre>
                </Tabs.TabPane>
                <Tabs.TabPane tab="File Items" key="2">
                  <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {JSON.stringify(fileItems, null, 2)}
                  </pre>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Active Section" key="3">
                  <div>
                    <p><strong>Active Section ID:</strong> {activeSection}</p>
                    <p><strong>Content Found:</strong> {getContentForSection(activeSection || '') ? 'Yes' : 'No'}</p>
                    {activeSection && (
                      <div>
                        <p><strong>Matching Content Item:</strong></p>
                        <pre style={{ maxHeight: '400px', overflow: 'auto' }}>
                          {JSON.stringify(getContentForSection(activeSection), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Direct Content Display" key="4">
                  <div>
                    <Title level={4}>All Content Items</Title>
                    {fileItems.map((item, index) => (
                      <Card key={index} style={{ marginBottom: '20px' }} title={`Item ${index + 1}: ${item.title}`}>
                        <p><strong>ID:</strong> {item.id}</p>
                        <p><strong>Document Catalog ID:</strong> {item.documentCatalogId}</p>
                        <Button 
                          type="primary" 
                          onClick={() => {
                            const contentArea = document.getElementById('direct-content-area');
                            if (contentArea) {
                              contentArea.innerHTML = `
                                <h3>${item.title}</h3>
                                <div>${item.content}</div>
                              `;
                            }
                          }}
                        >
                          Display Content
                        </Button>
                      </Card>
                    ))}
                    <div id="direct-content-area" style={{ marginTop: '20px', padding: '20px', border: '1px solid #f0f0f0' }}></div>
                  </div>
                </Tabs.TabPane>
              </Tabs>
            </Collapse.Panel>
          </Collapse>
        </div>
      </Card>
    </div>
  );
}

// Wrap the WikiContent component with Suspense to fix the build error
export default function WikiPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" tip="Loading..." /></div>}>
      <WikiContent />
    </Suspense>
  )
}
