import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "h-12 rounded-[18px] font-medium text-[16px] transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-[#4A89DA] text-white shadow-sm shadow-blue-200",
    secondary: "bg-[#F6F1EA] border border-[#E6E6E8] text-[#4A89DA]",
    ghost: "bg-transparent text-[#777B80]",
    danger: "bg-red-50 text-red-500"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-white rounded-[24px] p-5 shadow-sm ${className}`}>
        {children}
    </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
    <div className="flex flex-col gap-2 mb-4">
        {label && <label className="text-[14px] text-[#777B80] font-medium ml-1">{label}</label>}
        <input 
            className={`h-12 rounded-[14px] bg-[#FFFFFF] border border-[#E6E6E8] px-4 text-[#1C1C1E] focus:outline-none focus:border-[#4A89DA] transition-colors placeholder:text-gray-300 ${className}`}
            {...props}
        />
    </div>
);
