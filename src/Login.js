import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';

const USERNAME = 'wangyingxu'; // 你可以自定义
const PASSWORD = 'jiayou'; // 你可以自定义

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      if (
        values.username === USERNAME &&
        values.password === PASSWORD
      ) {
        localStorage.setItem('isLoggedIn', 'true');
        message.success('登录成功！');
        onLogin && onLogin();
      } else {
        message.error('账号或密码错误');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="登录" style={{ width: 350 }}>
        <Form name="login" onFinish={onFinish} autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}> 
            <Input placeholder="账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 