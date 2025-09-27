"use client";

import { useState, useEffect } from "react";
import { User, Crown, BarChart3, Zap, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import CreditsDisplay from "@/components/CreditsDisplay";

export default function ProfilePage() {
  const { data: session } = useSession();
  
  // Credits data - Use real user ID from session
  const userId = session?.user?.email ? `user_${session.user.email}` : null;
  const userCredits = useQuery(api.credits.getUserCredits, 
    userId ? { userId } : "skip"
  );
  const creditUsage = useQuery(api.credits.getCreditUsage,
    userId ? { userId, limit: 10 } : "skip"
  );
  const initializeCredits = useMutation(api.credits.initializeCredits);

  // Initialize credits for new users
  useEffect(() => {
    const initUserCredits = async () => {
      if (userId && userCredits === null && session?.user?.email) {
        try {
          await initializeCredits({
            userId,
            email: session.user.email,
            plan: "free"
          });
        } catch (error) {
          console.log("Credits initialization failed:", error);
        }
      }
    };

    initUserCredits();
  }, [userId, userCredits, initializeCredits, session?.user?.email]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your profile</h1>
          <Link href="/" className="text-orange-600 hover:text-orange-700">Go back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              MutterData
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-8 text-white mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{session.user.name || 'User'}</h1>
              <p className="text-orange-100">{session.user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Crown className="w-4 h-4" />
                <span className="font-semibold">
                  {userCredits ? `${userCredits.plan.charAt(0).toUpperCase() + userCredits.plan.slice(1)} Plan` : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Display */}
        <div className="mb-6">
          {userCredits ? (
            <CreditsDisplay credits={userCredits} />
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Usage History */}
        {creditUsage && creditUsage.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {creditUsage.slice(0, 5).map((usage, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      {usage.action === 'voice_query' && <Zap className="w-4 h-4 text-orange-600" />}
                      {usage.action === 'ai_insight' && <BarChart3 className="w-4 h-4 text-orange-600" />}
                      {usage.action === 'file_upload' && <TrendingUp className="w-4 h-4 text-orange-600" />}
                      {usage.action === 'email_report' && <User className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{usage.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(usage.timestamp).toLocaleDateString()} at {new Date(usage.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-orange-600">
                    -{usage.creditsUsed} credits
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Plan</h3>
            <p className="text-gray-600 mb-4">
              {userCredits ? `${userCredits.plan.charAt(0).toUpperCase() + userCredits.plan.slice(1)} Plan` : 'Loading...'}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Credits Remaining:</span>
                <span className="font-medium text-orange-600">
                  {userCredits ? userCredits.credits.toLocaleString() : '---'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly Allowance:</span>
                <span className="font-medium">
                  {userCredits ? userCredits.totalCredits.toLocaleString() : '---'}
                </span>
              </div>
            </div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors w-full justify-center"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Credit Usage Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Voice queries cost 1 credit each</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                <span>AI insights cost 2 credits each</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span>File uploads cost 5 credits each</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Credits reset monthly. Use them to unlock MutterData's full potential!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
