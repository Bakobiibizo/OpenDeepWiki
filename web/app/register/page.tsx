'use client'

import { Card, Form, Input, Button, Checkbox, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GithubOutlined, GoogleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../login/auth.module.css';
import { register } from '../services/authService';
import { useState } from 'react';
import { API_URL } from '../services/api';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 处理注册
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // 调用注册API
      const response = await register(values.username, values.email, values.password);
      
      if (response.success) {
        // 注册成功
        message.success('注册成功，即将跳转到登录页面...');
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        // 注册失败
        message.error(response.message || '注册失败，请重试');
      }
    } catch (error) {
      console.error('注册错误:', error);
      message.error('注册过程中发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth处理
  const handleGithubLogin = () => {
    // 直接重定向到后端的GitHub OAuth授权URL
    window.location.href = `${API_URL}/api/Auth/GitHubOAuth`;
  };

  // Google OAuth处理
  const handleGoogleLogin = () => {
    // 直接重定向到后端的Google OAuth授权URL
    window.location.href = `${API_URL}/api/Auth/GoogleOAuth`;
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <Card className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>注册 OpenDeepWiki</h1>
            <p className={styles.authSubtitle}>创建一个新的账户</p>
          </div>
          
          <Form
            name="register_form"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            className={styles.authForm}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 4, message: '用户名至少4个字符' }
              ]}
            >
              <Input 
                prefix={<UserOutlined className={styles.siteFormItemIcon} />} 
                placeholder="用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<MailOutlined className={styles.siteFormItemIcon} />} 
                placeholder="邮箱"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少8个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.siteFormItemIcon} />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.siteFormItemIcon} />}
                placeholder="确认密码"
                size="large"
              />
            </Form.Item>
            
            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                { 
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意用户协议和隐私政策')),
                },
              ]}
              className={styles.agreement}
            >
              <Checkbox>
                <span className={styles.agreementText}>
                  我已阅读并同意 <Link href="/terms">用户协议</Link> 和 <Link href="/privacy">隐私政策</Link>
                </span>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className={styles.loginButton}
                size="large"
                block
                loading={loading}
              >
                注册
              </Button>
            </Form.Item>
            
            <div className={styles.registerLink}>
              已有账户? <Link href="/login">立即登录</Link>
            </div>
            
            <Divider plain>其他注册方式</Divider>
            
            <div className={styles.socialLogin}>
              <Button 
                icon={<GithubOutlined />} 
                size="large"
                className={styles.socialButton}
                onClick={handleGithubLogin}
              >
                Github
              </Button>
              <Button 
                icon={<GoogleOutlined />} 
                size="large"
                className={styles.socialButton}
                onClick={handleGoogleLogin}
              >
                Google
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
} 