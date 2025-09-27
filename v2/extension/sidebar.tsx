import React from 'react';
import { createRoot } from 'react-dom/client';
import styled from '@emotion/styled';

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #ffffff;
  color: #1a1a1a;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1976d2;
`;

const Content = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Button = styled.button`
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1565c0;
  }

  &:active {
    background-color: #0d47a1;
  }
`;

const StatusText = styled.p`
  color: #666;
  font-size: 13px;
  margin: 8px 0 0 0;
`;

// Loading component
const LoadingView: React.FC = () => (
  <Container>
    <Content
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div>Loading...</div>
    </Content>
  </Container>
);

// Unauthenticated view component
const UnauthenticatedView: React.FC<{ onLogin: () => void }> = ({
  onLogin,
}) => (
  <Card>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
      Welcome to Hypertweet
    </h3>
    <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
      Sign in to manage your AI-powered reply tones and account settings.
    </p>
    <Button onClick={onLogin}>Sign In</Button>
    <StatusText>
      Connect to start using AI-powered contextual replies
    </StatusText>
  </Card>
);

// Authenticated dashboard component
const AuthenticatedView: React.FC<{ onLogout: () => void }> = ({
  onLogout,
}) => (
  <>
    <Card>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Dashboard</h3>
      <p
        style={{
          margin: '0 0 16px 0',
          color: '#666',
          fontSize: '14px',
        }}
      >
        Welcome back! Your AI reply system is active.
      </p>
      <StatusText>✅ Connected and ready to generate replies</StatusText>
    </Card>

    <Card>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
        Tone Management
      </h3>
      <p
        style={{
          margin: '0 0 16px 0',
          color: '#666',
          fontSize: '14px',
        }}
      >
        Manage your custom AI reply tones and styles.
      </p>
      <Button style={{ marginRight: '8px' }}>View Tones</Button>
      <Button style={{ backgroundColor: '#4caf50' }}>Create New</Button>
    </Card>

    <Card>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Account</h3>
      <p
        style={{
          margin: '0 0 16px 0',
          color: '#666',
          fontSize: '14px',
        }}
      >
        Manage your profile and account settings.
      </p>
      <Button onClick={onLogout} style={{ backgroundColor: '#f44336' }}>
        Sign Out
      </Button>
    </Card>
  </>
);

// Main Sidebar Component
const Sidebar: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const token = await chrome.storage.sync.get(['authToken']);
        setIsAuthenticated(!!token['authToken']);
      } catch (error) {
        if (process.env['NODE_ENV'] === 'development') {
          console.error('Auth check failed:', error);
        }
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth().catch(error => {
      if (process.env['NODE_ENV'] === 'development') {
        console.error('Failed to check auth:', error);
      }
    });
  }, []);

  const handleLogin = (): void => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log('Login clicked');
    }
    setIsAuthenticated(true);
  };

  const handleLogout = (): void => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log('Logout clicked');
    }
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <Container>
      <Header>
        <Title>Hypertweet</Title>
      </Header>
      <Content>
        {!isAuthenticated ? (
          <UnauthenticatedView onLogin={handleLogin} />
        ) : (
          <AuthenticatedView onLogout={handleLogout} />
        )}
      </Content>
    </Container>
  );
};

// Initialize the sidebar
const initSidebar = (): void => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<Sidebar />);
  }
};

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
