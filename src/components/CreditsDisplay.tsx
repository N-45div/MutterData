"use client";

import { Crown, Zap, TrendingUp } from "lucide-react";

interface CreditsDisplayProps {
  credits: {
    plan: string;
    credits: number;
    totalCredits: number;
    usedCredits: number;
    resetDate: number;
  };
}

const PLAN_COLORS = {
  free: "from-gray-500 to-gray-600",
  starter: "from-blue-500 to-blue-600", 
  pro: "from-purple-500 to-purple-600",
  business: "from-orange-500 to-amber-500"
};

const PLAN_FEATURES = {
  free: ["Basic voice queries", "Email reports", "File uploads"],
  starter: ["Advanced analytics", "Priority support", "Export reports"],
  pro: ["Team collaboration", "Custom integrations", "Advanced AI"],
  business: ["White label", "Enterprise support", "Custom features"]
};

export default function CreditsDisplay({ credits }: CreditsDisplayProps) {
  const planColor = PLAN_COLORS[credits.plan as keyof typeof PLAN_COLORS] || PLAN_COLORS.free;
  const features = PLAN_FEATURES[credits.plan as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free;
  const usagePercentage = (credits.usedCredits / credits.totalCredits) * 100;
  const daysUntilReset = Math.ceil((credits.resetDate - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${planColor}`}>
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1)} Plan
            </h3>
            <p className="text-sm text-gray-500">
              Resets in {daysUntilReset} days
            </p>
          </div>
        </div>
      </div>

      {/* Credits Overview */}
      <div className="space-y-4">
        {/* Credits Remaining */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Credits Remaining</span>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-xl font-bold text-orange-600">
              {credits.credits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Usage This Month</span>
            <span className="font-medium">
              {credits.usedCredits.toLocaleString()} / {credits.totalCredits.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full bg-gradient-to-r ${planColor} transition-all duration-300`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{usagePercentage.toFixed(1)}% used</span>
            <span>{credits.totalCredits.toLocaleString()}</span>
          </div>
        </div>

        {/* Plan Features */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Plan Features</h4>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Credit Costs Info */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Credit Costs</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>🎤 Voice Query: 1 credit</div>
            <div>🤖 AI Insight: 2 credits</div>
            <div>📁 File Upload: 5 credits</div>
            <div>📧 Email Report: 3 credits</div>
          </div>
        </div>

        {/* Low Credits Warning */}
        {credits.credits < 10 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-800">
                Low Credits Warning
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              You have {credits.credits} credits remaining. Consider upgrading your plan for more credits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
