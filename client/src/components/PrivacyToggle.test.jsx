import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PrivacyToggle from './PrivacyToggle'

describe('PrivacyToggle', () => {
  it('renders with default props', () => {
    const mockOnChange = vi.fn()
    
    render(
      <PrivacyToggle 
        showCity={true} 
        onChange={mockOnChange} 
      />
    )
    
    expect(screen.getByText('Show city on profile')).toBeInTheDocument()
    expect(screen.getByText('When enabled, other users can see your city information')).toBeInTheDocument()
    expect(screen.getByText('Visible')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('renders in disabled state when showCity is false', () => {
    const mockOnChange = vi.fn()
    
    render(
      <PrivacyToggle 
        showCity={false} 
        onChange={mockOnChange} 
      />
    )
    
    expect(screen.getByText('Hidden')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange when toggle is clicked', () => {
    const mockOnChange = vi.fn()
    
    render(
      <PrivacyToggle 
        showCity={true} 
        onChange={mockOnChange} 
      />
    )
    
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    
    expect(mockOnChange).toHaveBeenCalledWith(false)
  })

  it('does not call onChange when disabled', () => {
    const mockOnChange = vi.fn()
    
    render(
      <PrivacyToggle 
        showCity={true} 
        onChange={mockOnChange} 
        disabled={true}
      />
    )
    
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('renders custom label and description', () => {
    const mockOnChange = vi.fn()
    
    render(
      <PrivacyToggle 
        showCity={true} 
        onChange={mockOnChange}
        label="Custom Label"
        description="Custom description text"
      />
    )
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    const mockOnChange = vi.fn()
    
    render(
      <PrivacyToggle 
        showCity={false} 
        onChange={mockOnChange} 
      />
    )
    
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(toggle).toHaveAttribute('aria-label', 'Show city on profile')
  })
})