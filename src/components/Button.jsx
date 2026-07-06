import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  // Map variant to styling classes
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      case 'outline':
        return 'btn-outline';
      case 'link':
        return 'btn-link';
      case 'primary':
      default:
        return 'btn-primary';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn ${getVariantClass()} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner">Loading...</span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
