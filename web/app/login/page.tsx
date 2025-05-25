'use client'

import { Card, Form, Input, Button, Checkbox, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, GithubOutlined, GoogleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';
import { login } from '../services/authService';
import { useState } from 'react';
import { API_URL } from '../services/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 处理登录
  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      // 调用登录API
      const response = await login(values.username, values.password);
      if (response.success) {
        // 登录成功
        // 保存登录状态
        localStorage.setItem('userToken', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);

        // 保存用户信息
        if (response.user) {
          localStorage.setItem('userInfo', JSON.stringify(response.user));
        }

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          // 检查是否有上一个页面的路径（比如从管理页面重定向来的）
          const redirectPath = localStorage.getItem('redirectPath') || '/admin';
          localStorage.removeItem('redirectPath'); // 清除重定向路径
          router.push(redirectPath);
        }, 1000);
      } else {
        // 登录失败
        message.error(response.message || '用户名或密码错误');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('登录过程中发生错误，请重试');
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
            <h1 className={styles.authTitle}>登录 OpenDeepWiki</h1>
            <p className={styles.authSubtitle}>欢迎回来，请登录您的账户</p>
          </div>

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            className={styles.authForm}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名/邮箱' }]}
            >
              <Input
                prefix={<UserOutlined className={styles.siteFormItemIcon} />}
                placeholder="用户名/邮箱"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.siteFormItemIcon} />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <div className={styles.rememberForgot}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>

                <Link href="/forgot-password" className={styles.forgotLink}>
                  忘记密码?
                </Link>
              </div>
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
                登录
              </Button>
            </Form.Item>

            <div className={styles.registerLink}>
              还没有账户? <Link href="/register">立即注册</Link>
            </div>

            <Divider plain>其他登录方式</Divider>

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