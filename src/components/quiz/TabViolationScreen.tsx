import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabViolationScreenProps {
  onBack: () => void;
  reason?: 'tab-switch' | 'inspect' | 'copy';
}

export default function TabViolationScreen({ onBack, reason = 'tab-switch' }: TabViolationScreenProps) {
  const reasonText = {
    'tab-switch': 'Tab switching detected during assessment. Quiz has been automatically ended.',
    'inspect': 'Developer tools/Inspect attempt detected. Quiz has been automatically ended.',
    'copy': 'Copy attempt detected. This action is not allowed during the quiz.',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="neu-card p-8 border-4 border-destructive space-y-6 text-center">
        <AlertCircle className="w-20 h-20 mx-auto text-destructive" />
        <h2 className="text-3xl font-bold text-destructive">QUIZ TERMINATED</h2>
        <p className="text-lg text-foreground">
          {reasonText[reason]}
        </p>
        <p className="text-muted-foreground font-mono">
          This was an unauthorized action and your attempt has been recorded and invalidated.
        </p>
        <button
          onClick={onBack}
          className="neu-btn px-8 py-3 bg-secondary text-foreground inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>
      </div>
    </motion.div>
  );
}
