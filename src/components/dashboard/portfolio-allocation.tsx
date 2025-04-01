"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AssetAllocation = {
  category: string;
  value: number;
  percentage: number;
  color: string;
};

type PortfolioAllocationProps = {
  allocations: AssetAllocation[];
  totalValue: number;
  currency?: string;
  isLoading?: boolean;
};

export function PortfolioAllocation({
  allocations = [],
  totalValue = 0,
  currency = "USD",
  isLoading = false,
}: PortfolioAllocationProps) {
  if (isLoading) {
    return <PortfolioAllocationSkeleton />;
  }

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
      <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0]">
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Portfolio Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Simple pie chart visualization */}
          <div className="relative w-48 h-48">
            {allocations.length > 0 ? (
              <>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {renderPieChart(allocations)}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="font-bold text-lg">
                    {currency} {totalValue.toLocaleString()}
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full">
                <Wallet className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex-1">
            {allocations.length > 0 ? (
              <div className="space-y-2">
                {allocations.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.category}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-gray-500">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="font-medium">
                        {currency} {item.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No allocation data available</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function renderPieChart(allocations: AssetAllocation[]) {
  let cumulativePercentage = 0;
  const elements = [];

  for (const item of allocations) {
    const startAngle = cumulativePercentage * 3.6; // 3.6 = 360 / 100
    cumulativePercentage += item.percentage;
    const endAngle = cumulativePercentage * 3.6;

    // Convert angles to radians and calculate path
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + 50 * Math.cos(startRad);
    const y1 = 50 + 50 * Math.sin(startRad);
    const x2 = 50 + 50 * Math.cos(endRad);
    const y2 = 50 + 50 * Math.sin(endRad);

    // Create path element
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`,
    ].join(" ");

    elements.push(
      <path
        key={item.category}
        d={pathData}
        fill={item.color}
        stroke="white"
        strokeWidth="1"
      />,
    );
  }

  return elements;
}

function PortfolioAllocationSkeleton() {
  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
      <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0]">
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Portfolio Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <Skeleton className="w-48 h-48 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
