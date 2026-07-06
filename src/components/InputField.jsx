import React from 'react';

const InputField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${name}`;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span className="error-text" style={{ display: 'inline' }}>*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`input-control ${Icon ? 'with-icon' : ''} ${error ? 'error' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
