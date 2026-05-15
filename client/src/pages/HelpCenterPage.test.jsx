import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HelpCenterPage from './HelpCenterPage';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  HelpCircle: () => <div data-testid="help-circle-icon">HelpCircle</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
  BookOpen: () => <div data-testid="book-open-icon">BookOpen</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HelpCenterPage', () => {
  it('renders the help center page with title', () => {
    renderWithRouter(<HelpCenterPage />);
    
    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('Find answers to common questions about using BookVerse')).toBeInTheDocument();
  });

  it('displays search input', () => {
    renderWithRouter(<HelpCenterPage />);
    
    const searchInput = screen.getByPlaceholderText('Search for help...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays quick links section', () => {
    renderWithRouter(<HelpCenterPage />);
    
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('About BookVerse')).toBeInTheDocument();
    expect(screen.getByText('Safety Guidelines')).toBeInTheDocument();
    expect(screen.getAllByText('Contact Support').length).toBeGreaterThan(0);
  });

  it('displays all FAQ sections', () => {
    renderWithRouter(<HelpCenterPage />);
    
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Book Listings')).toBeInTheDocument();
    expect(screen.getByText('Trading Process')).toBeInTheDocument();
    expect(screen.getByText('Wishlist & Matching')).toBeInTheDocument();
    expect(screen.getByText('Messaging')).toBeInTheDocument();
    expect(screen.getByText('Safety & Trust')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
  });

  it('displays FAQ questions', () => {
    renderWithRouter(<HelpCenterPage />);
    
    expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
    expect(screen.getByText('How do I list a book for trading?')).toBeInTheDocument();
    expect(screen.getByText('How do I propose a trade?')).toBeInTheDocument();
  });

  it('toggles FAQ answer when question is clicked', async () => {
    renderWithRouter(<HelpCenterPage />);
    
    const question = screen.getByText('How do I create an account?');
    
    // Initially, the answer should not be visible
    expect(screen.queryByText(/Click "Get Started" or "Sign Up"/)).not.toBeInTheDocument();
    
    // Click the question to expand
    fireEvent.click(question);
    
    // Wait for the answer to appear
    await waitFor(() => {
      expect(screen.getByText(/Click "Get Started" or "Sign Up"/)).toBeInTheDocument();
    });
    
    // Click again to collapse
    fireEvent.click(question);
    
    // Wait for the answer to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Click "Get Started" or "Sign Up"/)).not.toBeInTheDocument();
    });
  });

  it('filters FAQ based on search query', async () => {
    renderWithRouter(<HelpCenterPage />);
    
    const searchInput = screen.getByPlaceholderText('Search for help...');
    
    // Type a search query
    fireEvent.change(searchInput, { target: { value: 'password' } });
    
    // Wait for filtering to occur
    await waitFor(() => {
      // Should show questions related to password
      expect(screen.getByText('How do I change my password?')).toBeInTheDocument();
      expect(screen.getByText('I forgot my password')).toBeInTheDocument();
      
      // Should not show unrelated questions
      expect(screen.queryByText('How do I list a book for trading?')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when search has no matches', async () => {
    renderWithRouter(<HelpCenterPage />);
    
    const searchInput = screen.getByPlaceholderText('Search for help...');
    
    // Type a search query that won't match anything
    fireEvent.change(searchInput, { target: { value: 'xyzabc123nonexistent' } });
    
    // Wait for no results message
    await waitFor(() => {
      expect(screen.getByText(/No results found for/)).toBeInTheDocument();
    });
  });

  it('displays "Still Need Help" section', () => {
    renderWithRouter(<HelpCenterPage />);
    
    expect(screen.getByText('Still Need Help?')).toBeInTheDocument();
    expect(screen.getByText(/Can't find what you're looking for/)).toBeInTheDocument();
  });

  it('has working links to other pages', () => {
    renderWithRouter(<HelpCenterPage />);
    
    const aboutLink = screen.getByRole('link', { name: /About BookVerse/i });
    const safetyLink = screen.getByRole('link', { name: /Safety Guidelines/i });
    const contactLinks = screen.getAllByRole('link', { name: /Contact Support/i });
    
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(safetyLink).toHaveAttribute('href', '/safety');
    expect(contactLinks[0]).toHaveAttribute('href', '/contact');
  });

  it('displays troubleshooting section with common issues', () => {
    renderWithRouter(<HelpCenterPage />);
    
    expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
    expect(screen.getByText('I didn\'t receive the verification email')).toBeInTheDocument();
    expect(screen.getByText('I forgot my password')).toBeInTheDocument();
    expect(screen.getByText('My book images aren\'t uploading')).toBeInTheDocument();
  });

  it('displays contact information in troubleshooting answers', async () => {
    renderWithRouter(<HelpCenterPage />);
    
    // Find and click on a troubleshooting question
    const question = screen.getByText('The website isn\'t loading properly');
    fireEvent.click(question);
    
    // Wait for the answer to appear
    await waitFor(() => {
      expect(screen.getByText(/Try refreshing the page/)).toBeInTheDocument();
      expect(screen.getByText(/If issues persist, contact us/)).toBeInTheDocument();
    });
  });
});
