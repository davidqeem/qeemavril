"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityItem = {
  id: string;
  date: string;
  type: "buy" | "sell" | "dividend" | "deposit" | "withdrawal" | "other";
  description: string;
  amount: number;
  currency: string;
  symbol?: string;
};

type RecentActivitiesProps = {
  activities: ActivityItem[];
  isLoading?: boolean;
};

export function RecentActivities({
  activities = [],
  isLoading = false,
}: RecentActivitiesProps) {
  if (isLoading) {
    return <RecentActivitiesSkeleton />;
  }

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
      <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0]">
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${getActivityIconBackground(activity.type)}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {getActivityTitle(activity)}
                    </h4>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                </div>
                <div
                  className={`font-medium ${getActivityAmountColor(activity.type)}`}
                >
                  {getActivityAmountPrefix(activity.type)}
                  {activity.currency}{" "}
                  {Math.abs(activity.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-gray-50">
            <div className="inline-flex rounded-full bg-blue-100 p-4 mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-muted-foreground mb-2">
              No recent activities found.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "buy":
      return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    case "sell":
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    case "dividend":
      return <ArrowDownRight className="h-4 w-4 text-blue-600" />;
    case "deposit":
      return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    case "withdrawal":
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    default:
      return <Activity className="h-4 w-4 text-gray-600" />;
  }
}

function getActivityIconBackground(type: ActivityItem["type"]) {
  switch (type) {
    case "buy":
    case "deposit":
      return "bg-green-100";
    case "sell":
    case "withdrawal":
      return "bg-red-100";
    case "dividend":
      return "bg-blue-100";
    default:
      return "bg-gray-100";
  }
}

function getActivityTitle(activity: ActivityItem) {
  switch (activity.type) {
    case "buy":
      return `Bought ${activity.symbol || activity.description}`;
    case "sell":
      return `Sold ${activity.symbol || activity.description}`;
    case "dividend":
      return `Dividend from ${activity.symbol || activity.description}`;
    case "deposit":
      return `Deposit to account`;
    case "withdrawal":
      return `Withdrawal from account`;
    default:
      return activity.description;
  }
}

function getActivityAmountColor(type: ActivityItem["type"]) {
  switch (type) {
    case "buy":
    case "withdrawal":
      return "text-red-600";
    case "sell":
    case "dividend":
    case "deposit":
      return "text-green-600";
    default:
      return "text-gray-900";
  }
}

function getActivityAmountPrefix(type: ActivityItem["type"]) {
  switch (type) {
    case "buy":
    case "withdrawal":
      return "-";
    case "sell":
    case "dividend":
    case "deposit":
      return "+";
    default:
      return "";
  }
}

function RecentActivitiesSkeleton() {
  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
      <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0]">
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
