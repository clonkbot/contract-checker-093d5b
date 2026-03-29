import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, AlertCircle, Info, ChevronDown, Lightbulb, Quote } from "lucide-react";

interface TrapCardProps {
  trap: {
    _id: string;
    title: string;
    severity: "high" | "medium" | "low";
    clause: string;
    explanation: string;
    recommendation: string;
  };
  index: number;
}

export function TrapCard({ trap, index }: TrapCardProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  const severityConfig = {
    high: {
      icon: <AlertOctagon className="w-5 h-5" />,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      badge: "bg-red-500/20 text-red-400",
      label: "High Risk",
    },
    medium: {
      icon: <AlertCircle className="w-5 h-5" />,
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      badge: "bg-amber-500/20 text-amber-400",
      label: "Medium",
    },
    low: {
      icon: <Info className="w-5 h-5" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400",
      badge: "bg-blue-500/20 text-blue-400",
      label: "Low",
    },
  };

  const config = severityConfig[trap.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-zinc-900/50 backdrop-blur-xl border ${config.border} rounded-2xl overflow-hidden`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 md:gap-4 p-4 md:p-5 text-left hover:${config.bg} transition-colors`}
      >
        <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl ${config.bg} flex items-center justify-center ${config.text}`}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
              {config.label}
            </span>
          </div>
          <h4 className="text-base md:text-lg font-semibold text-white truncate">{trap.title}</h4>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-4">
          {/* Clause */}
          <div className={`${config.bg} rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <Quote className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-zinc-300 leading-relaxed italic">
                "{trap.clause}"
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              What This Means
            </h5>
            <p className="text-sm text-zinc-400 leading-relaxed pl-3.5">
              {trap.explanation}
            </p>
          </div>

          {/* Recommendation */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-green-400 mb-1">Recommendation</h5>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {trap.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
