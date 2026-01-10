import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageInput from './MessageInput';
import { describe, test, expect, vi } from 'vitest';

describe('MessageInput', () => {
  test('renders input field and send button', () => {
    render(<MessageInput onSendMessage={vi.fn()} />);
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
  });

  test('updates input value when typing', () => {
    render(<MessageInput onSendMessage={vi.fn()} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    expect(input.value).toBe('Hello world');
  });

  test('calls onSendMessage when form is submitted', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSendMessage={mockSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  test('clears input after successful message send', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSendMessage={mockSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  test('does not send empty messages', () => {
    const mockSendMessage = vi.fn();
    render(<MessageInput onSendMessage={mockSendMessage} />);
    
    const form = screen.getByPlaceholderText('Type your message...').closest('form');
    fireEvent.submit(form);
    
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  test('trims whitespace before sending', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSendMessage={mockSendMessage} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: '  Test message  ' } });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  test('disables input and button when disabled prop is true', () => {
    render(<MessageInput onSendMessage={vi.fn()} disabled={true} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const button = screen.getByRole('button', { type: 'submit' });
    
    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  test('send button is disabled when input is empty', () => {
    render(<MessageInput onSendMessage={vi.fn()} />);
    
    const button = screen.getByRole('button', { type: 'submit' });
    expect(button).toBeDisabled();
  });

  test('send button is enabled when input has text', () => {
    render(<MessageInput onSendMessage={vi.fn()} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const button = screen.getByRole('button', { type: 'submit' });
    
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(button).not.toBeDisabled();
  });

  test('respects maxLength attribute', () => {
    render(<MessageInput onSendMessage={vi.fn()} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    expect(input).toHaveAttribute('maxLength', '1000');
  });

  test('displays hint text', () => {
    render(<MessageInput onSendMessage={vi.fn()} />);
    
    expect(screen.getByText(/Press Enter to send/i)).toBeInTheDocument();
  });
});
