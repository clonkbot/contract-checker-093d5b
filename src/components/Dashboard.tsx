import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LogOut, Upload, FileText, AlertTriangle,
  CheckCircle, Clock, Trash2, ChevronRight, X,
  AlertOctagon, AlertCircle, Info
} from "lucide-react";
import { FileUploader } from "./FileUploader";
import { TrapCard } from "./TrapCard";

export function Dashboard() {
  const { signOut } = useAuthActions();
  const contracts = useQuery(api.contracts.list);
  const [selectedContractId, setSelectedContractId] = useState<Id<"contracts"> | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const deleteContract = useMutation(api.contracts.remove);

  const selectedContract = contracts?.find((c: { _id: Id<"contracts"> }) => c._id === selectedContractId);

  const handleDelete = async (id: Id<"contracts">) => {
    if (selectedContractId === id) {
      setSelectedContractId(null);
    }
    await deleteContract({ id });
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <Shield className="w-7 h-7 md:w-8 md:h-8 text-amber-500" />
              <AlertTriangle className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-500 absolute -top-0.5 -right-0.5" />
            </div>
            <h1 className="text-lg md:text-xl font-bold">
              <span className="text-white">Contract</span>
              <span className="text-amber-500">Checker</span>
            </h1>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm md:text-base"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Sidebar - Contract List */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`w-full lg:w-80 flex-shrink-0 ${selectedContractId ? 'hidden lg:block' : ''}`}
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
                <h2 className="font-semibold text-white">Your Contracts</h2>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                  {contracts?.length || 0} files
                </span>
              </div>

              <div className="p-3 md:p-4">
                <button
                  onClick={() => setShowUploader(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                >
                  <Upload className="w-5 h-5" />
                  Upload Contract
                </button>
              </div>

              {/* Contract List */}
              <div className="max-h-[50vh] lg:max-h-[calc(100vh-350px)] overflow-y-auto">
                {contracts === undefined ? (
                  <div className="p-4 text-center text-zinc-500">Loading...</div>
                ) : contracts.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No contracts yet</p>
                    <p className="text-zinc-600 text-xs mt-1">Upload your first contract to get started</p>
                  </div>
                ) : (
                  <div className="px-2 pb-2 space-y-1">
                    {contracts.map((contract: ContractItemProps["contract"]) => (
                      <ContractItem
                        key={contract._id}
                        contract={contract}
                        isSelected={selectedContractId === contract._id}
                        onSelect={() => setSelectedContractId(contract._id)}
                        onDelete={() => handleDelete(contract._id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>

          {/* Main Area - Analysis Results */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 min-w-0"
          >
            {selectedContract ? (
              <ContractAnalysis
                contract={selectedContract}
                onBack={() => setSelectedContractId(null)}
              />
            ) : (
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl h-full min-h-[300px] md:min-h-[500px] flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 md:w-10 md:h-10 text-zinc-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Select a Contract</h3>
                  <p className="text-zinc-500 text-sm max-w-sm">
                    Choose a contract from the list or upload a new one to see the analysis
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploader && (
          <FileUploader onClose={() => setShowUploader(false)} />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="text-center text-zinc-600 text-xs py-4">
        Requested by @web-user · Built by @clonkbot
      </footer>
    </div>
  );
}

interface ContractItemProps {
  contract: {
    _id: Id<"contracts">;
    fileName: string;
    status: string;
    createdAt: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ContractItem({ contract, isSelected, onSelect, onDelete }: ContractItemProps) {
  const statusIcons = {
    uploading: <Clock className="w-4 h-4 text-blue-400 animate-pulse" />,
    analyzing: <Clock className="w-4 h-4 text-amber-400 animate-pulse" />,
    completed: <CheckCircle className="w-4 h-4 text-green-400" />,
    error: <AlertTriangle className="w-4 h-4 text-red-400" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-amber-500/20 border border-amber-500/30"
          : "hover:bg-zinc-800/50 border border-transparent"
      }`}
      onClick={onSelect}
    >
      <div className="flex-shrink-0">
        <FileText className={`w-5 h-5 ${isSelected ? "text-amber-500" : "text-zinc-500"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? "text-amber-100" : "text-white"}`}>
          {contract.fileName}
        </p>
        <p className="text-xs text-zinc-500">
          {new Date(contract.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {statusIcons[contract.status as keyof typeof statusIcons]}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
        <ChevronRight className={`w-4 h-4 ${isSelected ? "text-amber-500" : "text-zinc-600"}`} />
      </div>
    </motion.div>
  );
}

interface ContractAnalysisProps {
  contract: {
    _id: Id<"contracts">;
    fileName: string;
    status: string;
    createdAt: number;
  };
  onBack: () => void;
}

function ContractAnalysis({ contract, onBack }: ContractAnalysisProps) {
  const traps = useQuery(api.traps.listByContract, { contractId: contract._id });

  type Severity = "high" | "medium" | "low";
  type SeverityCounts = { high: number; medium: number; low: number };

  const severityCounts: SeverityCounts | undefined = traps?.reduce(
    (acc: SeverityCounts, trap: { severity: Severity }) => {
      acc[trap.severity]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as SeverityCounts
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-4 md:p-6">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="lg:hidden flex-shrink-0 p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>

          <div className="flex-shrink-0 hidden sm:block">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 md:w-7 md:h-7 text-amber-500" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-white truncate">{contract.fileName}</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Uploaded {new Date(contract.createdAt).toLocaleDateString()}
            </p>

            {contract.status === "analyzing" && (
              <div className="flex items-center gap-2 mt-3 text-amber-400 text-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-amber-400/20 border-t-amber-400 rounded-full"
                />
                Analyzing contract...
              </div>
            )}
          </div>
        </div>

        {/* Severity Summary */}
        {contract.status === "completed" && severityCounts && (
          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-zinc-800/50">
            <SeverityBadge
              icon={<AlertOctagon className="w-4 h-4 md:w-5 md:h-5" />}
              label="High Risk"
              count={severityCounts.high}
              color="red"
            />
            <SeverityBadge
              icon={<AlertCircle className="w-4 h-4 md:w-5 md:h-5" />}
              label="Medium"
              count={severityCounts.medium}
              color="amber"
            />
            <SeverityBadge
              icon={<Info className="w-4 h-4 md:w-5 md:h-5" />}
              label="Low"
              count={severityCounts.low}
              color="blue"
            />
          </div>
        )}
      </div>

      {/* Traps List */}
      {contract.status === "completed" && (
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-base md:text-lg font-semibold text-white px-1">
            Issues Found ({traps?.length || 0})
          </h3>

          {traps === undefined ? (
            <div className="text-center py-8 text-zinc-500">Loading analysis...</div>
          ) : traps.length === 0 ? (
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-white">Looking Good!</h4>
              <p className="text-zinc-500 text-sm mt-1">No major issues detected in this contract</p>
            </div>
          ) : (
            <div className="space-y-3">
              {traps
                .sort((a: { severity: Severity }, b: { severity: Severity }) => {
                  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .map((trap: { _id: string; title: string; severity: Severity; clause: string; explanation: string; recommendation: string }, index: number) => (
                  <TrapCard key={trap._id} trap={trap} index={index} />
                ))}
            </div>
          )}
        </div>
      )}

      {contract.status === "error" && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-white">Analysis Failed</h4>
          <p className="text-zinc-400 text-sm mt-1">
            We couldn't analyze this contract. Please try uploading again.
          </p>
        </div>
      )}
    </div>
  );
}

interface SeverityBadgeProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: "red" | "amber" | "blue";
}

function SeverityBadge({ icon, label, count, color }: SeverityBadgeProps) {
  const colors = {
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  };

  return (
    <div className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl border ${colors[color]}`}>
      {icon}
      <span className="text-lg md:text-2xl font-bold text-white">{count}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
