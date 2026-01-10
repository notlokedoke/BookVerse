import { render, screen } from '@testing-library/react';
import MessageBubble from './MessageBubble';
import { describe, test, expect } from 'vitest';

const mockMessage = {
  _id: '507f1f77bcf86cd799439011',
  content: 'Hello, this is a test message!',
  createdAt: '2025-02-01T14:30:00Z',
  sender: {
    _id: '507f191e810c19729de860ea',
    name: 'John Doe'
  }
};

describe('MessageBubble', () => {
  test('renders message content correctly', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false} 
        senderName="John Doe" 
      />
    );
    
    expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
  });

  test('displays sender name for other user messages', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false} 
        senderName="John Doe" 
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('does not display sender name for own messages', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={true} 
        senderName="John Doe" 
      />
    );
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  test('applies correct CSS class for own messages', () => {
    const { container } = render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={true} 
        senderName="John Doe" 
      />
    );
    
    const wrapper = container.querySelector('.message-bubble-wrapper');
    expect(wrapper).toHaveClass('own-message');
    
    const bubble = container.querySelector('.message-bubble');
    expect(bubble).toHaveClass('own');
  });

  test('applies correct CSS class for other user messages', () => {
    const { container } = render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false} 
        senderName="John Doe" 
      />
    );
    
    const wrapper = container.querySelector('.message-bubble-wrapper');
    expect(wrapper).toHaveClass('other-message');
    
    const bubble = container.querySelector('.message-bubble');
    expect(bubble).toHaveClass('other');
  });

  test('formats timestamp correctly', () => {
    render(
      <MessageBubble 
        message={mockMessage} 
        isOwnMessage={false} 
        senderName="John Doe" 
      />
    );
    
    // The time should be formatted (exact format depends on locale)
    const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeElement).toBeInTheDocument();
  });

  test('handles missing timestamp gracefully', () => {
    const messageWithoutTime = { ...mockMessage, createdAt: null };
    
    render(
      <MessageBubble 
        message={messageWithoutTime} 
        isOwnMessage={false} 
        senderName="John Doe" 
      />
    );
    
    expect(screen.getByText('Hello, this is a test message!')).toBeInTheDocument();
  });

  test('renders long messages correctly', () => {
    const longMessage = {
      ...mockMessage,
      content: 'This is a very long message that contains a lot of text to test how the component handles longer content. It should wrap properly and maintain readability.'
    };
    
    render(
      <MessageBubble 
        message={longMessage} 
        isOwnMessage={false} 
        senderName="John Doe" 
      />
    );
    
    expect(screen.getByText(longMessage.content)).toBeInTheDocument();
  });
});
