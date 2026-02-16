import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Check, X, Crown, Sparkles, Zap, Shield, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        priceDisplay: '₹0',
        period: 'forever',
        description: 'Perfect for getting started',
        icon: Zap,
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

const PlanCard = ({ planKey, plan, currentPlan, onSubscribe, loading, index }) => {
    const isCurrentPlan = currentPlan === planKey;
    const Icon = plan.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`relative rounded-[20px] p-6 transition-all duration-500 group ${plan.popular
                ? 'bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] border-2 border-[#111] dark:border-[#eee]'
                : 'bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] hover:bg-white dark:hover:bg-[#151515] hover:border-[#e8e8e8] dark:hover:border-[#222] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]'
                }`}
        >
            {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white dark:bg-[#111] text-[#111] dark:text-[#eee] text-[10px] font-semibold px-3 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wider shadow-sm">
                        <Sparkles size={10} strokeWidth={1.5} /> Most Popular
                    </span>
                </div>
            )}

            <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${plan.popular
                    ? 'bg-white/10 dark:bg-[#111]/10'
                    : 'bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222]'
                    }`}>
                    <Icon size={20} strokeWidth={1.5} className={plan.popular ? '' : 'text-[#888]'} />
                </div>
                <h3 className={`text-[16px] font-bold ${plan.popular ? '' : 'text-[#111] dark:text-[#eee]'}`}>{plan.name}</h3>
                <p className={`text-[12px] mt-1 ${plan.popular ? 'text-white/50 dark:text-[#111]/50' : 'text-[#999]'}`}>{plan.description}</p>
                <div className="mt-4">
                    <span className={`text-3xl font-bold ${plan.popular ? '' : 'text-[#111] dark:text-[#eee]'}`}>{plan.priceDisplay}</span>
                    <span className={`text-[13px] ${plan.popular ? 'text-white/40 dark:text-[#111]/40' : 'text-[#999]'}`}>{plan.period}</span>
                </div>
            </div>

            <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                        {feature.included ? (
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${plan.popular
                                ? 'bg-white/10 dark:bg-[#111]/10'
                                : 'bg-[#f0f0f0] dark:bg-[#1a1a1a]'
                                }`}>
                                <Check size={12} strokeWidth={2} className={plan.popular ? '' : 'text-[#111] dark:text-[#eee]'} />
                            </div>
                        ) : (
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${plan.popular
                                ? 'bg-white/5 dark:bg-[#111]/5'
                                : 'bg-[#f0f0f0] dark:bg-[#1a1a1a]'
                                }`}>
                                <X size={12} strokeWidth={2} className={plan.popular ? 'text-white/20 dark:text-[#111]/20' : 'text-[#ccc] dark:text-[#444]'} />
                            </div>
                        )}
                        <span className={`text-[12px] ${feature.included
                            ? plan.popular ? 'text-white/80 dark:text-[#111]/80' : 'text-[#111] dark:text-[#eee]'
                            : plan.popular ? 'text-white/20 dark:text-[#111]/20' : 'text-[#bbb] dark:text-[#555]'
                            }`}>
                            {feature.name}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSubscribe(planKey)}
                disabled={isCurrentPlan || loading || planKey === 'free'}
                className={`w-full py-3 px-4 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40
                    ${isCurrentPlan
                        ? plan.popular
                            ? 'bg-white/20 dark:bg-[#111]/20 cursor-default'
                            : 'bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#111] dark:text-[#eee] cursor-default'
                        : plan.popular
                            ? 'bg-white dark:bg-[#111] text-[#111] dark:text-[#eee] hover:bg-white/90 dark:hover:bg-[#111]/90'
                            : 'bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] hover:bg-[#333] dark:hover:bg-[#ccc]'
                    }`}
            >
                {loading === planKey ? (
                    <>
                        <Loader2 size={14} className="animate-spin" strokeWidth={1.5} />
                        Processing...
                    </>
                ) : isCurrentPlan ? (
                    <>
                        <Check size={14} strokeWidth={1.5} />
                        Current Plan
                    </>
                ) : planKey === 'free' ? (
                    'Free Forever'
                ) : (
                    `Upgrade to ${plan.name}`
                )}
            </button>
        </motion.div>
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
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                throw new Error('Failed to load Razorpay SDK');
            }

            const orderRes = await api.post('/subscription/create-order', { plan });
            const orderData = orderRes.data;

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'CareerCraft AI',
                description: `${orderData.planName} Plan Subscription`,
                order_id: orderData.orderId,
                handler: async (response) => {
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
                    color: '#111111'
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
        <div className="py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em] mb-3"
                    >
                        Choose Your Plan
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-[#999] text-[14px] max-w-lg mx-auto"
                    >
                        Unlock your full learning potential with our premium plans.
                    </motion.p>
                </div>

                {/* Alerts */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto mb-6 p-4 rounded-[14px] bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center gap-3"
                    >
                        <AlertCircle className="text-red-500 flex-shrink-0" size={16} strokeWidth={1.5} />
                        <p className="text-red-600 dark:text-red-400 text-[13px]">{error}</p>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto mb-6 p-4 rounded-[14px] bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center gap-3"
                    >
                        <Check className="text-[#111] dark:text-[#eee] flex-shrink-0" size={16} strokeWidth={1.5} />
                        <p className="text-[#111] dark:text-[#eee] text-[13px] font-medium">{success}</p>
                    </motion.div>
                )}

                {/* Plan Cards */}
                <div className="grid md:grid-cols-3 gap-5">
                    {Object.entries(PLANS).map(([key, plan], index) => (
                        <PlanCard
                            key={key}
                            planKey={key}
                            plan={plan}
                            currentPlan={currentPlan}
                            onSubscribe={handleSubscribe}
                            loading={loading}
                            index={index}
                        />
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-[#bbb] dark:text-[#555] text-[12px]">
                        All payments are processed securely via Razorpay. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
