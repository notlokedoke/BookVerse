import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ServerErrorPage from './ServerErrorPage';

describe('ServerErrorPage', () => {
  const renderServerErrorPage = () => {
    return render(
      <BrowserRouter>
        <ServerErrorPage />
      </BrowserRouter>
    );
  };

  it('renders 500 error code', () => {
    renderServerErrorPage();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders error title', () => {
    renderServerErrorPage();
    expect(screen.getByText('Server Error')).toBeInTheDocument();
  });

  it('renders user-friendly error message', () => {
    renderServerErrorPage();
    expect(screen.getByText(/Something went wrong on our end/i)).toBeInTheDocument();
  });

  it('renders refresh and home buttons', () => {
    renderServerErrorPage();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
  });

  it('renders troubleshooting suggestions', () => {
    renderServerErrorPage();
    expect(screen.getByText(/What you can do:/i)).toBeInTheDocument();
    expect(screen.getByText(/Wait a few minutes and try again/i)).toBeInTheDocument();
  });

  it('renders support contact information', () => {
    renderServerErrorPage();
    expect(screen.getByText(/Need help\?/i)).toBeInTheDocument();
    const supportLink = screen.getByRole('link', { name: /contact support/i });
    expect(supportLink).toHaveAttribute('href', 'mailto:support@bookverse.com');
  });

  it('refreshes page when refresh button is clicked', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    renderServerErrorPage();
    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    fireEvent.click(refreshButton);

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('has correct link to home page', () => {
    renderServerErrorPage();
    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
