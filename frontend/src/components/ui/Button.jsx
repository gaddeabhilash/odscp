export const Button = ({ children, onClick, type = "button", variant = "primary", className = "", isLoading = false }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={isLoading}
      className={`${base} ${variants[variant]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
      ) : null}
      {children}
    </button>
  );
};
