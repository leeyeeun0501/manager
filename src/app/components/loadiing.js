import React, { useState, useEffect } from "react"

const SpinnerTypes = {
  spinner: ({ size, color }) => (
    <div
      className={`${size} border-4 border-gray-200 ${color} border-t-transparent rounded-full animate-spin`}
    ></div>
  ),

  ring: ({ size, color }) => (
    <div
      className={`${size} border-4 border-gray-200 ${color} border-l-transparent rounded-full animate-spin`}
    ></div>
  ),

  pulse: ({ size, color }) => (
    <div
      className={`${size} ${color.replace(
        "border-",
        "bg-"
      )} rounded-full animate-pulse`}
    ></div>
  ),

  dots: ({ color }) => (
    <div className="flex space-x-2">
      <div
        className={`w-3 h-3 ${color.replace(
          "border-",
          "bg-"
        )} rounded-full animate-bounce`}
      ></div>
      <div
        className={`w-3 h-3 ${color.replace(
          "border-",
          "bg-"
        )} rounded-full animate-bounce`}
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className={`w-3 h-3 ${color.replace(
          "border-",
          "bg-"
        )} rounded-full animate-bounce`}
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  ),

  bars: ({ color }) => (
    <div className="flex space-x-1">
      <div
        className={`w-2 h-8 ${color.replace("border-", "bg-")} animate-pulse`}
      ></div>
      <div
        className={`w-2 h-8 ${color.replace("border-", "bg-")} animate-pulse`}
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className={`w-2 h-8 ${color.replace("border-", "bg-")} animate-pulse`}
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  ),

  ripple: ({ size, color }) => (
    <div className="relative">
      <div
        className={`${size} ${color.replace(
          "border-",
          "border-2 border-"
        )} rounded-full animate-ping absolute`}
      ></div>
      <div
        className={`${size} ${color.replace(
          "border-",
          "border-2 border-"
        )} rounded-full`}
      ></div>
    </div>
  ),
}

const Loading = ({
  isLoading,
  type = "spinner",
  size = "lg",
  color = "blue",
  text = "로딩 중...",
  backdrop = "blur",
  zIndex = 9999,
}) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setShow(true)
    } else {
      const timer = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (!show) return null

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }

  const colorClasses = {
    blue: "border-blue-500",
    green: "border-green-500",
    red: "border-red-500",
    purple: "border-purple-500",
    gray: "border-gray-500",
    white: "border-white",
  }

  const textColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    gray: "text-gray-600",
    white: "text-white",
  }

  const backdropClasses = {
    blur: "bg-black bg-opacity-50 backdrop-blur-sm",
    dark: "bg-black bg-opacity-70",
    light: "bg-white bg-opacity-80",
    transparent: "bg-black bg-opacity-30",
  }

  const SpinnerComponent = SpinnerTypes[type] || SpinnerTypes.spinner

  return (
    <div
      className={`fixed inset-0 ${
        backdropClasses[backdrop]
      } flex items-center justify-center transition-opacity duration-300 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
      style={{ zIndex }}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <SpinnerComponent
          size={sizeClasses[size]}
          color={colorClasses[color]}
        />
        {text && (
          <p
            className={`text-lg ${textColorClasses[color]} font-medium animate-pulse`}
          >
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export default Loading
