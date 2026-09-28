import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle, Zap, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SiJavascript, SiPython, SiCplusplus, SiPhp, SiRuby, SiGo, SiRust } from "react-icons/si";
import { FaJava } from "react-icons/fa"; // SiJava is sometimes problematic, FaJava is safer

const LANGUAGES = [
  { name: "JavaScript", code: "javascript", icon: SiJavascript, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", free: true, description: "Advanced AST parsing for JS/TS environments." },
  { name: "Python", code: "python", icon: SiPython, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", free: true, description: "Deep analysis for Django, Flask, and FastAPI." },
  { name: "Java", code: "java", icon: FaJava, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", free: true, description: "Enterprise-grade JDBC and Hibernate security checks." },
  { name: "C++", code: "cpp", icon: SiCplusplus, color: "text-blue-600", bg: "bg-blue-600/10", border: "border-blue-600/20", free: true, description: "Memory and query-level vulnerability detection." },
  { name: "PHP", code: "php", icon: SiPhp, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20", free: false, description: "Premium PDO & MySQLi vulnerability analysis." },
  { name: "Ruby", code: "ruby", icon: SiRuby, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", free: false, description: "ActiveRecord & Rails framework security scanning." },
  { name: "Go", code: "go", icon: SiGo, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", free: false, description: "GORM and raw SQL package security code analysis." },
  { name: "Rust", code: "rust", icon: SiRust, color: "text-orange-600", bg: "bg-orange-600/10", border: "border-orange-600/20", free: false, description: "Diesel ORM and sqlx memory-safe code scanning." },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function Languages() {
  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-12 text-center mt-4">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 bg-white/5 border-white/10 backdrop-blur-md text-purple-400 gap-1.5 px-3 py-1">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Scanning Engine
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Supported <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Languages</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              SQLShield supports deep semantic analysis for the world's most popular backend languages. Free tier users get access to our core 4, while Premium unlocks the full ecosystem.
            </p>
          </motion.div>
        </div>

        {/* Free Tier Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Core Languages</h2>
            <Badge variant="secondary" className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">Included</Badge>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-border to-transparent ml-4" />
          </div>
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {LANGUAGES.filter(l => l.free).map((lang) => (
              <motion.div key={lang.code} variants={cardVariants}>
                <Card className="glass overflow-hidden border-white/5 hover:border-white/20 transition-all duration-300 h-full group relative">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${lang.color.replace('text-', 'from-')}/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${lang.bg} ${lang.border} border`}>
                        <lang.icon className={`w-6 h-6 ${lang.color}`} />
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500/70" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{lang.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{lang.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Premium Tier Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-purple-100">Premium Ecosystem</h2>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">PRO</Badge>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-purple-500/20 to-transparent ml-4" />
          </div>
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {LANGUAGES.filter(l => !l.free).map((lang) => (
              <motion.div key={lang.code} variants={cardVariants}>
                <Card className="relative overflow-hidden border-purple-500/10 bg-black/40 backdrop-blur-xl h-full group hover:border-purple-500/30 transition-all duration-500">
                  {/* Subtle Premium Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent z-0" />
                  
                  <CardContent className="p-6 relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${lang.bg} border ${lang.border} relative`}>
                        <div className="absolute inset-0 bg-black/40 rounded-xl" /> {/* Darken icon for lock effect */}
                        <lang.icon className={`w-6 h-6 ${lang.color} relative z-10 opacity-70`} />
                      </div>
                      <div className="p-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                        <Lock className="w-4 h-4 text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white/90">{lang.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{lang.description}</p>
                    
                    <Button 
                      variant="outline" 
                      className="w-full bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40 text-purple-300 transition-all"
                    >
                      Unlock {lang.name}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Global CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-black backdrop-blur-xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
            <CardContent className="p-10 md:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <Shield className="w-8 h-8 text-purple-400" />
                  <h2 className="text-3xl font-bold text-white">Unlock the Full Arsenal</h2>
                </div>
                <p className="text-purple-200/70 text-lg max-w-xl">
                  Get access to all premium languages, unlimited AI fixes, downloadable PDF audits, and real-time Slack integrations.
                </p>
              </div>
              <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-3">
                <Button size="lg" className="w-full md:w-auto h-14 px-8 text-lg font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all border-0 text-white">
                  <Zap className="w-5 h-5 mr-2" /> Upgrade to Pro
                </Button>
                <span className="text-xs text-purple-300/50">Cancel anytime. 14-day money-back guarantee.</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
