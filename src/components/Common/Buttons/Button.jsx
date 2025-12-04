import React from "react";

const Button = ({ text, icon: Icon, onClick, color, iconSize = 22, className = "" }) => {

  const hoverColors = {
    "bg-red-600": "hover:bg-red-700",
    "bg-green-600": "hover:bg-green-700",
    "bg-blue-600": "hover:bg-blue-700",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${color} ${className} text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all ${hoverColors[color] || ""} hover:shadow-xl`}
    >
      {Icon && <Icon size={iconSize} />}
      {text}
    </button>
  );
};

export default Button;
