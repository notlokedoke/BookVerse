import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer Component', () => {
  const renderFooter = () => {
    return render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
  };

  it('renders the footer with brand name', () => {
    renderFooter();
    expect(screen.getByText('BookVerse')).toBeInTheDocument();
  });

  it('displays Safety Guidelines link', () => {
    renderFooter();
    const safetyLink = screen.getByRole('link', { name: /safety guidelines/i });
    expect(safetyLink).toBeInTheDocument();
    expect(safetyLink).toHaveAttribute('href', '/safety');
  });

  it('displays all main navigation sections', () => {
    renderFooter();
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('displays Browse Books link', () => {
    renderFooter();
    const browseLink = screen.getByRole('link', { name: /browse books/i });
    expect(browseLink).toBeInTheDocument();
    expect(browseLink).toHaveAttribute('href', '/browse');
  });

  it('displays copyright information', () => {
    renderFooter();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} BookVerse`))).toBeInTheDocument();
  });

  it('displays contact support link', () => {
    renderFooter();
    const contactLink = screen.getByRole('link', { name: /contact support/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', 'mailto:support@bookverse.com');
  });
});
