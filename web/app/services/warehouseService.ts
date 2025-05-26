import { fetchApi, ApiResponse, API_URL } from './api';
import { Repository, RepositoryFormValues } from '../types';

/**
 * Repository submission interface
 */
export interface WarehouseSubmitRequest {
  address: string;
  type: string;
  branch: string;
  prompt: string;
  model: string;
  openAIKey: string;
  openAIEndpoint: string;
}

/**
 * Response structure for warehouse list
 */
export interface WarehouseListResponse {
  total: number;
  items: Repository[];
}

/**
 * 获取仓库分支列表的返回结构
 */
export interface BranchListResponse {
  success: boolean;
  data: string[];
  defaultBranch?: string;
  error?: string;
}

/**
 * Submit a new repository to the warehouse
 * 这个函数仍然需要在客户端使用
 */
export async function submitWarehouse(
  data: RepositoryFormValues
): Promise<ApiResponse<Repository>> {
  // @ts-ignore
  return fetchApi<Repository>(API_URL + '/api/Warehouse/SubmitWarehouse', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 获取仓库的分支列表
 * @param repoUrl 仓库地址
 * @param username 可选的用户名（私有仓库需要）
 * @param password 可选的密码或访问令牌（私有仓库需要）
 * @returns 分支列表和默认分支
 */
export async function getBranchList(
  repoUrl: string,
  username?: string,
  password?: string
): Promise<BranchListResponse> {
  try {
    // 解析仓库地址来确定是GitHub还是Gitee
    const url = new URL(repoUrl);
    const pathSegments = url.pathname.split('/').filter(segment => segment);
    
    if (pathSegments.length < 2) {
      return {
        success: false,
        data: [],
        error: '无效的仓库地址格式'
      };
    }
    
    const owner = pathSegments[0];
    // 移除.git后缀
    const repo = pathSegments[1].replace('.git', '');
    
    // 根据URL确定平台
    let branchesData: string[] = [];
    let defaultBranch: string | undefined;
    
    // GitHub仓库
    if (url.hostname === 'github.com' || url.hostname === 'www.github.com') {
      // 1. 先获取仓库信息以获取默认分支
      const repoInfoUrl = `https://api.github.com/repos/${owner}/${repo}`;
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      
      // 如果提供了凭据，添加授权头
      if (username && password) {
        const credentials = btoa(`${username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      
      const repoInfoResponse = await fetch(repoInfoUrl, { headers });
      
      if (!repoInfoResponse.ok) {
        throw new Error(`GitHub API请求失败: ${repoInfoResponse.status} ${repoInfoResponse.statusText}`);
      }
      
      const repoInfo = await repoInfoResponse.json();
      defaultBranch = repoInfo.default_branch;
      
      // 2. 获取分支列表
      const branchesUrl = `https://api.github.com/repos/${owner}/${repo}/branches`;
      const branchesResponse = await fetch(branchesUrl, { headers });
      
      if (!branchesResponse.ok) {
        throw new Error(`GitHub API请求失败: ${branchesResponse.status} ${branchesResponse.statusText}`);
      }
      
      const data = await branchesResponse.json();
      
      if (Array.isArray(data)) {
        branchesData = data.map(branch => branch.name);
      }
    }
    // Gitee仓库
    else if (url.hostname === 'gitee.com' || url.hostname === 'www.gitee.com') {
      // 1. 先获取仓库信息以获取默认分支
      let repoInfoUrl = `https://gitee.com/api/v5/repos/${owner}/${repo}`;
      
      // 如果提供了访问令牌
      if (password) {
        repoInfoUrl += `?access_token=${password}`;
      }
      
      const repoInfoResponse = await fetch(repoInfoUrl);
      
      if (!repoInfoResponse.ok) {
        throw new Error(`Gitee API请求失败: ${repoInfoResponse.status} ${repoInfoResponse.statusText}`);
      }
      
      const repoInfo = await repoInfoResponse.json();
      defaultBranch = repoInfo.default_branch;
      
      // 2. 获取分支列表
      let branchesUrl = `https://gitee.com/api/v5/repos/${owner}/${repo}/branches`;
      
      // 如果提供了访问令牌
      if (password) {
        branchesUrl += `?access_token=${password}`;
      }
      
      const branchesResponse = await fetch(branchesUrl);
      
      if (!branchesResponse.ok) {
        throw new Error(`Gitee API请求失败: ${branchesResponse.status} ${branchesResponse.statusText}`);
      }
      
      const data = await branchesResponse.json();
      
      if (Array.isArray(data)) {
        branchesData = data.map(branch => branch.name);
      }
    }
    // 其他Git提供商，尝试使用通用办法处理
    else {
      try {
        // 尝试通用Git API格式获取信息
        // 1. 首先尝试通用的API格式获取仓库信息
        const headers: HeadersInit = {};
        
        // 如果提供了凭据，尝试添加授权头
        if (username && password) {
          // 基本认证
          const credentials = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${credentials}`;
          
          // 也可能是令牌认证
          // headers['Authorization'] = `token ${password}`;
        }
        
        // 构建通用的API URL格式
        // 许多Git服务商都使用相似的API路径结构
        const apiBaseUrl = `${url.protocol}//${url.hostname}/api/v1`;
        const repoInfoUrl = `${apiBaseUrl}/repos/${owner}/${repo}`;
        
        const repoInfoResponse = await fetch(repoInfoUrl, { headers });
        
        if (repoInfoResponse.ok) {
          const repoInfo = await repoInfoResponse.json();
          defaultBranch = repoInfo.default_branch;
          
          // 尝试获取分支信息
          const branchesUrl = `${apiBaseUrl}/repos/${owner}/${repo}/branches`;
          const branchesResponse = await fetch(branchesUrl, { headers });
          
          if (branchesResponse.ok) {
            const data = await branchesResponse.json();
            
            if (Array.isArray(data)) {
              branchesData = data.map(branch => 
                typeof branch === 'object' && branch !== null && 'name' in branch 
                  ? branch.name 
                  : String(branch)
              );
              
              return {
                success: true,
                data: branchesData,
                defaultBranch: defaultBranch
              };
            }
          }
        }
        
        // 尝试通用的Git API v3格式
        const apiV3BaseUrl = `${url.protocol}//${url.hostname}/api/v3`;
        const repoInfoV3Url = `${apiV3BaseUrl}/repos/${owner}/${repo}`;
        
        const repoInfoV3Response = await fetch(repoInfoV3Url, { headers });
        
        if (repoInfoV3Response.ok) {
          const repoInfo = await repoInfoV3Response.json();
          defaultBranch = repoInfo.default_branch;
          
          // 尝试获取分支信息
          const branchesV3Url = `${apiV3BaseUrl}/repos/${owner}/${repo}/branches`;
          const branchesV3Response = await fetch(branchesV3Url, { headers });
          
          if (branchesV3Response.ok) {
            const data = await branchesV3Response.json();
            
            if (Array.isArray(data)) {
              branchesData = data.map(branch => 
                typeof branch === 'object' && branch !== null && 'name' in branch 
                  ? branch.name 
                  : String(branch)
              );
              
              return {
                success: true,
                data: branchesData,
                defaultBranch: defaultBranch
              };
            }
          }
        }
        
        // 如果以上都失败，返回默认分支
        return {
          success: false,
          data: ['main', 'master'], // 提供默认分支作为备选
          defaultBranch: 'main', // 假设main是默认分支
          error: '不支持的Git提供商，已尝试通用API但失败，请手动输入分支名'
        };
      } catch (error) {
        console.error('尝试通用API获取分支列表失败:', error);
        return {
          success: false,
          data: ['main', 'master'], // 提供默认分支作为备选
          defaultBranch: 'main', // 假设main是默认分支
          error: '不支持的Git提供商，请手动输入分支名'
        };
      }
    }
    
    return {
      success: true,
      data: branchesData,
      defaultBranch: defaultBranch
    };
  } catch (error) {
    console.error('获取分支列表失败:', error);
    return {
      success: false,
      data: ['main', 'master'], // 提供默认分支作为备选
      defaultBranch: 'main', // 假设main是默认分支
      error: error instanceof Error ? error.message : '获取分支列表时发生未知错误'
    };
  }
}

/**
 * Get warehouse list
 * 此函数可在服务器组件中使用
 */
export async function getWarehouse(page: number, pageSize: number, keyword?: string): Promise<ApiResponse<WarehouseListResponse>> {
  // @ts-ignore
  return fetchApi<WarehouseListResponse>(API_URL + '/api/Warehouse/WarehouseList?page=' + page + '&pageSize=' + pageSize + '&keyword=' + keyword, {
    method: 'GET',
    // 添加缓存控制使其适用于服务器组件
    cache: 'no-store'
  });
}

/**
 * 获取文档目录
 * 此函数可在服务器组件中使用
 */
export async function documentCatalog(organizationName: string, name: string, branch?: string): Promise<any> {
  // 构建URL，如果branch存在则添加到查询参数中
  let url = API_URL + '/api/DocumentCatalog/DocumentCatalogs?organizationName=' + organizationName + '&name=' + name;
  if (branch) {
    url += '&branch=' + branch;
  }
  
  // @ts-ignore
  return fetchApi<any>(url, {
    method: 'GET',
    // 添加缓存控制使其适用于服务器组件
    cache: 'no-store'
  });
}

/**
 * Fetch document file items (actual content) for a repository
 * This function can be used in client components
 */
export async function getDocumentFileItems(organizationName: string, name: string, branch?: string): Promise<any> {
  // Build URL with query parameters
  let url = API_URL + '/api/DocumentCatalog/DocumentFileItems?organizationName=' + organizationName + '&name=' + name;
  if (branch) {
    url += '&branch=' + branch;
  }
  
  // @ts-ignore
  return fetchApi<any>(url, {
    method: 'GET',
    cache: 'no-store'
  });
}

/**
 * 根据ID获取文档
 * 此函数可在服务器组件中使用
 */
export async function documentById(owner: string, name: string, path: string, branch?: string): Promise<any> {
  console.log(owner, name, path);
  // 构建URL，如果branch存在则添加到查询参数中
  let url = API_URL + '/api/DocumentCatalog/DocumentById?owner=' + owner + '&name=' + name + '&path=' + path;
  if (branch) {
    url += '&branch=' + branch;
  }
  
  // @ts-ignore
  return fetchApi<any>(url, {
    method: 'GET',
    // 添加缓存控制使其适用于服务器组件
    cache: 'no-store'
  });
}

/**
 * 获取仓库概览信息
 * 此函数可在服务器组件中使用
 */
export async function getWarehouseOverview(owner: string, name: string, branch?: string) {
  // 构建URL，如果branch存在则添加到查询参数中
  let url = API_URL + '/api/Warehouse/WarehouseOverview?owner=' + owner + '&name=' + name;
  if (branch) {
    url += '&branch=' + branch;
  }
  
  // @ts-ignore
  return fetchApi<any>(url, {
    method: 'GET',
    // 添加缓存控制使其适用于服务器组件
    cache: 'no-store'
  });
}

/**
 * 获取最近的仓库信息
 * 此函数可在服务器组件中使用
 */
export async function getLastWarehouse(address: string) {
  // @ts-ignore
  return fetchApi<any>(API_URL + '/api/Warehouse/LastWarehouse?address=' + address, {
    method: 'GET',
    // 添加缓存控制使其适用于服务器组件
    cache: 'no-store'
  });
}

/**
 * 获取更新日志
 * 此函数可在服务器组件中使用
 */
export async function getChangeLog(owner: string, name: string, branch?: string) {
  // 构建URL，如果branch存在则添加到查询参数中
  let url = API_URL + '/api/Warehouse/ChangeLog?owner=' + owner + '&name=' + name;
  if (branch) {
    url += '&branch=' + branch;
  }
  
  // @ts-ignore
  return fetchApi<any>(url, {
    method: 'GET',
    // 添加缓存控制使其适用于服务器组件
    cache: 'no-store'
  });
}


/**
 * 
 * @param warehouseId 
 * @param path 
 * @returns 
 */
export async function getFileContent(warehouseId: string, path: string) {
  return fetchApi<any>(API_URL + `/api/Warehouse/FileContent?warehouseId=${warehouseId}&path=${path}`, {
    method: 'GET',
    cache: 'no-cache'
  })
}


/**
 * 获取仓库的文件列表
 * 此函数可在服务器组件中使用
 * organization
 * repositoryName
 * file
 */
export async function UploadAndSubmitWarehouse(formData: FormData) {
  // 不要手动设置 Content-Type，让浏览器自动设置正确的 boundary
  return fetchApi<any>(API_URL + '/api/Warehouse/UploadAndSubmitWarehouse', {
    method: 'POST',
    body: formData,
  })
}

/**
 * 导出仓库的Markdown文件为ZIP
 * 此函数可在服务器组件中使用
 * @param warehouseId 仓库ID
 */
export async function ExportMarkdownZip(warehouseId: string) {
  return fetchApi<any>(API_URL + `/api/Warehouse/ExportMarkdownZip?warehouseId=${warehouseId}`, {
    method: 'POST'
  })
}
