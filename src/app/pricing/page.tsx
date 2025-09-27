"use client";

import { useState } from "react";
import { Check, Zap, Users, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      id: "free",
      name: "Free Tier",
      description: "Perfect for getting started",
      price: 0,
      annualPrice: 0,
      icon: Sparkles,
      color: "from-gray-500 to-gray-600",
      features: [
        "3 file uploads per month",
        "50 voice queries per month", 
        "20 AI insights per month",
        "Basic charts & visualizations",
        "Community support",
      ],
      limitations: [
        "Limited file size (5MB)",
        "Basic export options",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      id: "starter",
      name: "Starter Plan",
      description: "Great for individuals & small teams",
      price: 9.99,
      annualPrice: 95.90,
      icon: Zap,
      color: "from-orange-500 to-amber-500",
      features: [
        "25 file uploads per month",
        "500 voice queries per month",
        "200 AI insights per month", 
        "Advanced charts & visualizations",
        "10 report exports per month",
        "Email support",
        "Extra queries at $0.02 each",
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      id: "pro", 
      name: "Pro Plan",
      description: "For growing businesses",
      price: 29.99,
      annualPrice: 287.90,
      icon: Users,
      color: "from-blue-500 to-purple-500",
      features: [
        "100 file uploads per month",
        "2,000 voice queries per month",
        "1,000 AI insights per month",
        "Advanced analytics & insights",
        "50 report exports per month",
        "Team collaboration (5 members)",
        "Priority support",
        "Extra queries at $0.015 each",
        "Custom integrations",
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      id: "business",
      name: "Business Plan", 
      description: "For larger organizations",
      price: 99.99,
      annualPrice: 959.90,
      icon: Crown,
      color: "from-purple-500 to-pink-500",
      features: [
        "500 file uploads per month",
        "10,000 voice queries per month",
        "5,000 AI insights per month",
        "Enterprise analytics & insights",
        "200 report exports per month",
        "Team collaboration (25 members)",
        "Priority support & onboarding",
        "Extra queries at $0.01 each",
        "Custom integrations & API access",
        "White-label options",
        "Advanced security & compliance",
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            MutterData
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard" className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          Simple, Affordable
          <br />
          <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Voice Analytics
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Transform your data analysis with voice commands. Choose a plan that fits your needs and budget.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-12">
          <span className={`text-sm ${!isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAnnual ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
              Save 20%
            </span>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isAnnual ? plan.annualPrice : plan.price;
            const period = isAnnual ? 'year' : 'month';
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
                  plan.popular ? 'border-orange-200 scale-105' : 'border-gray-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">
                        ${price}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-500">/{period}</span>
                      )}
                      {isAnnual && plan.price > 0 && (
                        <div className="text-sm text-green-600 font-semibold">
                          Save ${((plan.price * 12) - plan.annualPrice).toFixed(2)}/year
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        </div>
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Can I change plans anytime?
            </h3>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What happens if I exceed my usage limits?
            </h3>
            <p className="text-gray-600">
              For paid plans, you'll be charged for overage at the rates shown. Free tier users will be prompted to upgrade. We'll always notify you before any charges.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Is there a free trial?
            </h3>
            <p className="text-gray-600">
              Yes! All paid plans come with a 14-day free trial. No credit card required to start. You can also use our free tier indefinitely.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Do you offer enterprise plans?
            </h3>
            <p className="text-gray-600">
              Absolutely! For organizations with custom needs, we offer enterprise plans with dedicated support, custom integrations, and volume discounts. Contact our sales team.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-orange-900 to-amber-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">MutterData</span>
            </div>
            <div className="text-orange-200">
              Built for the Modern Stack Hackathon 2025
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
