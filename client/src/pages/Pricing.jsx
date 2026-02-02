import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Check, X, Crown, Sparkles, Zap, Shield, Loader2, AlertCircle } from 'lucide-react';

const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        priceDisplay: '₹0',
        period: 'forever',
        description: 'Perfect for getting started',
        icon: Zap,
        color: 'gray',
        features: [
            { name: '3 Documents', included: true },
            { name: '50 AI queries/month', included: true },
            { name: '2 Quizzes/day', included: true },
            { name: '5 Flashcard decks', included: true },
            { name: 'Leaderboard access', included: true },
            { name: 'Mock interviews', included: false },
            { name: 'Priority support', included: false }
        ]
    },
    pro: {
        name: 'Pro',
        price: 299,
        priceDisplay: '₹299',
        period: '/month',
        description: 'For serious learners',
        icon: Crown,
        color: 'indigo',
        popular: true,
        features: [
            { name: 'Unlimited Documents', included: true },
            { name: '500 AI queries/month', included: true },
            { name: 'Unlimited Quizzes', included: true },
            { name: 'Unlimited Flashcard decks', included: true },
            { name: 'Leaderboard access', included: true },
            { name: '5 Mock interviews/month', included: true },
            { name: 'Priority support', included: false }
        ]
    },
    enterprise: {
        name: 'Enterprise',
        price: 999,
        priceDisplay: '₹999',
        period: '/month',
        description: 'For power users & teams',
        icon: Shield,
        color: 'purple',
        features: [
            { name: 'Unlimited Documents', included: true },
            { name: 'Unlimited AI queries', included: true },
            { name: 'Unlimited Quizzes', included: true },
            { name: 'Unlimited Flashcard decks', included: true },
            { name: 'Leaderboard access', included: true },
            { name: 'Unlimited Mock interviews', included: true },
            { name: 'Priority support', included: true }
        ]
    }
};

const PlanCard = ({ planKey, plan, currentPlan, onSubscribe, loading }) => {
    const isCurrentPlan = currentPlan === planKey;
    const Icon = plan.icon;

    const colorStyles = {
        gray: {
            bg: 'bg-gray-50 dark:bg-gray-800',
            border: 'border-gray-200 dark:border-gray-700',
            button: 'bg-gray-600 hover:bg-gray-700',
            icon: 'text-gray-500'
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-900/30',
            border: 'border-indigo-500 ring-2 ring-indigo-500',
            button: 'bg-indigo-600 hover:bg-indigo-700',
            icon: 'text-indigo-500'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-900/30',
            border: 'border-purple-400 dark:border-purple-600',
            button: 'bg-purple-600 hover:bg-purple-700',
            icon: 'text-purple-500'
        }
    };

    const styles = colorStyles[plan.color];

    return (
        <div className={`relative rounded-2xl p-6 ${styles.bg} border ${styles.border} transition-all duration-300 hover:shadow-xl`}>
            {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={12} /> Most Popular
                    </span>
                </div>
            )}

            <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${styles.bg} mb-4`}>
                    <Icon size={24} className={styles.icon} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.priceDisplay}</span>
                    <span className="text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
            </div>

            <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                        {feature.included ? (
                            <Check size={18} className="text-green-500 flex-shrink-0" />
                        ) : (
                            <X size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                            {feature.name}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSubscribe(planKey)}
                disabled={isCurrentPlan || loading || planKey === 'free'}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2
                    ${isCurrentPlan
                        ? 'bg-green-500 cursor-default'
                        : planKey === 'free'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : `${styles.button} cursor-pointer hover:shadow-lg`
                    }
                    disabled:opacity-70`}
            >
                {loading === planKey ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                    </>
                ) : isCurrentPlan ? (
                    <>
                        <Check size={18} />
                        Current Plan
                    </>
                ) : planKey === 'free' ? (
                    'Free Forever'
                ) : (
                    `Upgrade to ${plan.name}`
                )}
            </button>
        </div>
    );
};

const Pricing = () => {
    const [currentPlan, setCurrentPlan] = useState('free');
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchSubscriptionStatus();
    }, []);

    const fetchSubscriptionStatus = async () => {
        try {
            const res = await api.get('/subscription/status');
            setCurrentPlan(res.data.subscription?.plan || 'free');
        } catch (err) {
            console.error('Failed to fetch subscription status:', err);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = async (plan) => {
        if (plan === 'free' || plan === currentPlan) return;

        setLoading(plan);
        setError(null);
        setSuccess(null);

        try {
            // Load Razorpay SDK
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                throw new Error('Failed to load Razorpay SDK');
            }

            // Create order
            const orderRes = await api.post('/subscription/create-order', { plan });
            const orderData = orderRes.data;

            // Open Razorpay checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'CareerCraft AI',
                description: `${orderData.planName} Plan Subscription`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    // Verify payment
                    try {
                        const verifyRes = await api.post('/subscription/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan
                        });

                        setSuccess(`Successfully upgraded to ${PLANS[plan].name}! 🎉`);
                        setCurrentPlan(plan);
                    } catch (err) {
                        setError(err.response?.data?.message || err.message);
                    }
                    setLoading(null);
                },
                prefill: {},
                theme: {
                    color: '#6366f1'
                },
                modal: {
                    ondismiss: () => {
                        setLoading(null);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (err) {
            setError(err.message);
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Unlock your full learning potential with our premium plans.
                        All plans include access to AI-powered learning features.
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="max-w-md mx-auto mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                        <Check className="text-green-500 flex-shrink-0" size={20} />
                        <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
                    </div>
                )}

                {/* Plan Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {Object.entries(PLANS).map(([key, plan]) => (
                        <PlanCard
                            key={key}
                            planKey={key}
                            plan={plan}
                            currentPlan={currentPlan}
                            onSubscribe={handleSubscribe}
                            loading={loading}
                        />
                    ))}
                </div>

                {/* FAQ / Info */}
                <div className="mt-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        All payments are processed securely via Razorpay.
                        Cancel anytime. Questions? Contact support.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
