import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  UnorderedListOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons';
import './App.css';
import Login from './Login';
import TodoPage from './TodoPage';

const { Header, Sider, Content } = Layout;

function App() {
  const [selectedKey, setSelectedKey] = useState('todo');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (selectedKey) {
      case 'todo':
        return <TodoPage />;
      case 'review':
        return <div>项目回顾与心得（开发中）</div>;
      case 'article':
        return <div>文章输出（开发中）</div>;
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    switch (selectedKey) {
      case 'todo':
        return '本周待办';
      case 'review':
        return '项目回顾';
      case 'article':
        return '文章输出';
      default:
        return '';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div className="logo" style={{ color: '#fff', textAlign: 'center', padding: '16px 0', fontWeight: 'bold', fontSize: 20 }}>
          九日
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          items={[
            { key: 'todo', icon: <UnorderedListOutlined />, label: '待办事项' },
            { key: 'review', icon: <FileTextOutlined />, label: '项目回顾' },
            { key: 'article', icon: <EditOutlined />, label: '文章输出' },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>
          {getHeaderTitle()}
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
