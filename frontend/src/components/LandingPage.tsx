import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaBolt, FaCode, FaShieldAlt, FaAws, FaBrain } from 'react-icons/fa';

export default function LandingPage() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <div className="min-h-screen bg-void text-white overflow-x-hidden selection:bg-gold selection:text-black font-ui">

            {/* Sticky Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-md border-b border-void-border">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="DevMentor-360" className="w-16 h-16 object-contain" />
                        <span className="font-header text-xl font-bold tracking-widest">DEVMENTOR<span className="text-gold">360</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400">
                        <a href="#features" className="hover:text-gold transition-colors">FEATURES</a>
                        <a href="#agents" className="hover:text-gold transition-colors">AGENTS</a>
                        <a href="#aws" className="hover:text-gold transition-colors">AWS POWERED</a>
                        <button
                            onClick={() => navigate('/app')}
                            className="px-6 py-2 rounded-full bg-gold text-black hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        >
                            LAUNCH APP
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-psy-purple/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-psy-blue/30 bg-psy-blue/10 backdrop-blur-sm mb-8">
                            <FaAws className="text-psy-blue" />
                            <span className="text-xs font-bold tracking-widest text-psy-blue">BUILT FOR AWS GLOBAL VIBE 2025</span>
                        </div>

                        <h1 className="font-header text-6xl md:text-9xl font-bold mb-8 leading-none tracking-tight">
                            CODE WITH <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                                ALCHEMY
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                            Transform your development workflow with an autonomous AI engineering team.
                            Powered by <span className="text-white font-bold">Claude 3.5 Sonnet</span> and <span className="text-white font-bold">Amazon Bedrock</span>.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => navigate('/app')}
                                className="px-10 py-5 rounded-full bg-gold text-black font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,215,0,0.4)] flex items-center gap-3"
                            >
                                <FaBolt /> START CODING NOW
                            </button>
                            <button className="px-10 py-5 rounded-full border border-void-border bg-void-surface/50 text-white font-bold text-lg hover:bg-void-surface transition-colors flex items-center gap-3">
                                <FaCode /> VIEW GITHUB
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 relative z-10">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="font-header text-4xl md:text-5xl font-bold mb-6">HOW IT <span className="text-gold">WORKS</span></h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Transform your code in three simple steps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-psy-purple to-psy-purple/50 flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                                1
                            </div>
                            <h3 className="font-header text-xl font-bold mb-3 text-white">Write Code</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Use our Monaco-powered editor or load a sample buggy code snippet to get started instantly.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-black">
                                2
                            </div>
                            <h3 className="font-header text-xl font-bold mb-3 text-white">Select AI Agent</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Choose from Architect, Debugger, Reviewer, or Tester agents—each powered by Claude 3.5 Sonnet.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-psy-green to-psy-green/50 flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                                3
                            </div>
                            <h3 className="font-header text-xl font-bold mb-3 text-white">Get Instant Analysis</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Receive detailed, markdown-formatted reports with code fixes, security insights, or test suites.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3D Showcase Section */}
            <section className="py-32 relative z-10">
                <div className="container mx-auto px-6">
                    <motion.div
                        style={{ y }}
                        className="relative rounded-2xl border border-void-border bg-void-surface/50 backdrop-blur-xl p-4 shadow-2xl transform perspective-1000 rotate-x-12 scale-90 hover:scale-100 transition-transform duration-700"
                    >
                        {/* Mockup Interface Header */}
                        <div className="h-12 border-b border-void-border flex items-center px-4 gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        {/* Mockup Content Area (Placeholder for Screenshot) */}
                        <div className="aspect-video rounded-lg bg-void-surface border border-void-border flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-void to-black opacity-90" />
                            <div className="text-center z-10">
                                <FaCode className="text-6xl text-gold mb-4 mx-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-2xl font-bold text-gray-300">DevMentor-360 Workspace</h3>
                                <p className="text-gray-500">Intelligent Code Editor & Agent Panel</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 bg-void-surface/20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="font-header text-4xl md:text-5xl font-bold mb-6">THE <span className="text-gold">ALCHEMIST</span> SUITE</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Five specialized AI agents working in harmony to perfect your code.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<FaRobot className="text-4xl text-psy-purple" />}
                            title="The Architect"
                            desc="Analyzes your entire project structure using hybrid algorithms to detect design flaws and circular dependencies."
                            delay={0}
                        />
                        <FeatureCard
                            icon={<FaCode className="text-4xl text-psy-blue" />}
                            title="The Debugger"
                            desc="Uses Bedrock to analyze stack traces, find root causes, and auto-generate patches for complex bugs."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<FaShieldAlt className="text-4xl text-psy-green" />}
                            title="The Reviewer"
                            desc="Performs deep security audits and performance checks, ensuring your code is production-ready."
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* AWS Integration Section */}
            <section id="aws" className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-void to-psy-blue/5" />
                <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/10 mb-6">
                            <FaBrain className="text-gold" />
                            <span className="text-xs font-bold tracking-widest text-gold">GENERATIVE AI CORE</span>
                        </div>
                        <h2 className="font-header text-4xl md:text-5xl font-bold mb-6">
                            POWERED BY <br />
                            <span className="text-psy-blue">AMAZON BEDROCK</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            We leverage the massive context window and reasoning capabilities of
                            <strong className="text-white"> Claude 3.5 Sonnet</strong> via AWS Bedrock.
                            This allows our agents to understand your entire codebase, not just snippets.
                        </p>
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex items-center gap-3">
                                <FaAws className="text-gold text-xl" /> Enterprise-grade security and scalability
                            </li>
                            <li className="flex items-center gap-3">
                                <FaAws className="text-gold text-xl" /> Real-time inference with low latency
                            </li>
                            <li className="flex items-center gap-3">
                                <FaAws className="text-gold text-xl" /> Built with Amazon Q Developer
                            </li>
                        </ul>
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 bg-psy-blue/20 blur-[100px] rounded-full" />
                        <div className="relative bg-void-surface border border-void-border p-8 rounded-2xl shadow-2xl">
                            <pre className="font-code text-xs md:text-sm text-gray-300 overflow-x-auto">
                                <code>{`
// The Brain Behind the Magic
const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: fromNodeProviderChain()
});

const response = await bedrock.send(
  new InvokeModelCommand({
    modelId: "anthropic.claude-3-5-sonnet",
    body: JSON.stringify({
      prompt: "Analyze this architecture...",
      max_tokens: 4096
    })
  })
);
                `}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-32 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gold/5" />
                <div className="container mx-auto px-6 relative z-10">
                    <h2 className="font-header text-5xl md:text-7xl font-bold mb-8 text-white">
                        READY TO <span className="text-gold">TRANSMUTE</span>?
                    </h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                        Join the future of development. Experience the power of AI-driven engineering today.
                    </p>
                    <button
                        onClick={() => navigate('/app')}
                        className="px-12 py-6 rounded-full bg-white text-black font-bold text-xl hover:bg-gold transition-colors shadow-2xl"
                    >
                        LAUNCH DEVMENTOR-360
                    </button>
                </div>
            </section>

            <footer className="py-8 border-t border-void-border text-center text-gray-600 text-sm">
                <p>© 2025 DevMentor-360. Built for AWS Global Vibe Hackathon.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="p-8 rounded-2xl bg-void-surface border border-void-border hover:border-gold/30 transition-all duration-300 group hover:-translate-y-2"
        >
            <div className="mb-6 p-4 rounded-xl bg-black/50 inline-block border border-void-border group-hover:border-gold/50 transition-colors">
                {icon}
            </div>
            <h3 className="font-header text-xl font-bold mb-3 text-gray-200 group-hover:text-gold transition-colors">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
    );
}
