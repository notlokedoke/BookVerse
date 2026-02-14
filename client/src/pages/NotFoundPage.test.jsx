import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

describe('NotFoundPage', () => {
  const renderNotFoundPage = () => {
    return render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
  };

  it('renders 404 error code', () => {
    renderNotFoundPage();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders error title', () => {
    renderNotFoundPage();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders user-friendly error message', () => {
    renderNotFoundPage();
    expect(screen.getByText(/The page you're looking for seems to have wandered off/i)).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderNotFoundPage();
    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse books/i })).toBeInTheDocument();
  });

  it('renders helpful suggestions', () => {
    renderNotFoundPage();
    expect(screen.getByText(/You might want to:/i)).toBeInTheDocument();
    expect(screen.getByText(/Check the URL for typos/i)).toBeInTheDocument();
  });

  it('has correct link to home page', () => {
    renderNotFoundPage();
    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('has correct link to browse page', () => {
    renderNotFoundPage();
    const browseLink = screen.getByRole('link', { name: /browse books/i });
    expect(browseLink).toHaveAttribute('href', '/browse');
  });
});
