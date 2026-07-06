import React from 'react';

const Card = ({
  title,
  subtitle,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`auth-card ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="auth-header">
          {title && <h2 className="auth-title">{title}</h2>}
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
