import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FAQPage from './FAQPage';

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
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>
}));

const renderFAQPage = () => {
  return render(
    <BrowserRouter>
      <FAQPage />
    </BrowserRouter>
  );
};

describe('FAQPage', () => {
  it('renders the FAQ page with header', () => {
    renderFAQPage();
    
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText(/Common questions about using BookVerse/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderFAQPage();
    
    const searchInput = screen.getByPlaceholderText('Search FAQs...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders all FAQ sections', () => {
    renderFAQPage();
    
    expect(screen.getAllByText('Getting Started').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Book Listings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Trading Process').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Wishlist and Matching').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Messaging').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Safety and Trust').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Account Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Troubleshooting').length).toBeGreaterThan(0);
  });

  it('renders quick navigation section', () => {
    renderFAQPage();
    
    expect(screen.getByText('Jump to Section')).toBeInTheDocument();
  });

  it('toggles FAQ item when clicked', async () => {
    renderFAQPage();
    
    const questionButton = screen.getByText('How do I create an account?');
    expect(questionButton).toBeInTheDocument();
    
    // Initially, answer should not be visible
    expect(screen.queryByText(/Click "Get Started" or "Sign Up"/i)).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(questionButton);
    
    // Answer should now be visible
    await waitFor(() => {
      expect(screen.getByText(/Click "Get Started" or "Sign Up"/i)).toBeInTheDocument();
    });
    
    // Click again to collapse
    fireEvent.click(questionButton);
    
    // Answer should be hidden again
    await waitFor(() => {
      expect(screen.queryByText(/Click "Get Started" or "Sign Up"/i)).not.toBeInTheDocument();
    });
  });

  it('filters FAQ items based on search query', async () => {
    renderFAQPage();
    
    const searchInput = screen.getByPlaceholderText('Search FAQs...');
    
    // Search for "password"
    fireEvent.change(searchInput, { target: { value: 'password' } });
    
    await waitFor(() => {
      // Should show password-related questions
      expect(screen.getByText('How do I change my password?')).toBeInTheDocument();
      expect(screen.getByText('I forgot my password.')).toBeInTheDocument();
    });
    
    // Should not show unrelated sections
    expect(screen.queryByText('How do I list a book for trading?')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    renderFAQPage();
    
    const searchInput = screen.getByPlaceholderText('Search FAQs...');
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'xyzabc123nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText(/No results found for/i)).toBeInTheDocument();
    });
  });

  it('renders contact and support section', () => {
    renderFAQPage();
    
    expect(screen.getByText('Contact and Support')).toBeInTheDocument();
    expect(screen.getByText(/Can't find what you're looking for/i)).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('renders related resources section', () => {
    renderFAQPage();
    
    expect(screen.getByText('Related Documentation')).toBeInTheDocument();
    expect(screen.getByText('Safety Guide')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('About BookVerse')).toBeInTheDocument();
  });

  it('has correct links in contact section', () => {
    renderFAQPage();
    
    const contactButtons = screen.getAllByText('Contact Support');
    // Find the link element (not the heading)
    const contactLink = contactButtons.find(el => el.tagName === 'A');
    expect(contactLink).toHaveAttribute('href', '/contact');
    
    const helpButton = screen.getByText('Visit Help Center');
    expect(helpButton.closest('a')).toHaveAttribute('href', '/help');
  });

  it('has correct links in related resources', () => {
    renderFAQPage();
    
    const safetyLink = screen.getByText('Safety Guide').closest('a');
    expect(safetyLink).toHaveAttribute('href', '/safety');
    
    const termsLink = screen.getByText('Terms of Service').closest('a');
    expect(termsLink).toHaveAttribute('href', '/terms');
    
    const privacyLink = screen.getByText('Privacy Policy').closest('a');
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    
    const aboutLink = screen.getByText('About BookVerse').closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('renders urgent safety note', () => {
    renderFAQPage();
    
    expect(screen.getByText(/For urgent safety concerns/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact your local emergency services/i)).toBeInTheDocument();
  });

  it('multiple FAQ items can be open simultaneously', async () => {
    renderFAQPage();
    
    const question1 = screen.getByText('How do I create an account?');
    const question2 = screen.getByText('Is BookVerse free to use?');
    
    // Open first question
    fireEvent.click(question1);
    await waitFor(() => {
      expect(screen.getByText(/Click "Get Started" or "Sign Up"/i)).toBeInTheDocument();
    });
    
    // Open second question
    fireEvent.click(question2);
    await waitFor(() => {
      expect(screen.getByText(/There are no listing fees/i)).toBeInTheDocument();
    });
    
    // Both should be visible
    expect(screen.getByText(/Click "Get Started" or "Sign Up"/i)).toBeInTheDocument();
    expect(screen.getByText(/There are no listing fees/i)).toBeInTheDocument();
  });
});
