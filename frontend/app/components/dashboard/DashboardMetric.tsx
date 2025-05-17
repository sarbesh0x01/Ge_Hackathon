"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DashboardMetricProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  description?: string;
  trend?: number[];
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const DashboardMetric: React.FC<DashboardMetricProps> = ({
  title,
  value,
  change,
  icon,
  description,
  trend,
  variant = "default",
  className
}) => {
  const variantStyles = {
    default: "bg-white border",
    success: "bg-green-50 border-green-100 text-green-800",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
    danger: "bg-red-50 border-red-100 text-red-800"
  };

  // Simple sparkline renderer using div heights
  const renderTrend = () => {
    if (!trend || trend.length === 0) return null;

    const max = Math.max(...trend);
    const normalized = trend.map(val => (val / max) * 100);

    return (
      <div className="flex items-end h-8 gap-0.5 mt-1">
        {normalized.map((height, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-sm",
              variant === "success" ? "bg-green-300" :
                variant === "warning" ? "bg-amber-300" :
                  variant === "danger" ? "bg-red-300" :
                    "bg-blue-300"
            )}
            style={{ height: `${Math.max(15, height)}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={cn("rounded-lg p-4", variantStyles[variant], className)}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-semibold">
              {typeof value === 'number' && value > 1000
                ? value.toLocaleString()
                : value}
            </p>

            {change && (
              <span
                className={cn(
                  "ml-2 text-xs font-medium flex items-center",
                  change.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {change.isPositive ? (
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {Math.abs(change.value)}%
              </span>
            )}
          </div>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>

        {icon && (
          <div className={cn(
            "p-2 rounded-full",
            variant === "success" ? "bg-green-100" :
              variant === "warning" ? "bg-amber-100" :
                variant === "danger" ? "bg-red-100" :
                  "bg-blue-100"
          )}>
            {icon}
          </div>
        )}
      </div>

      {trend && renderTrend()}
    </div>
  );
};

export default DashboardMetric;
