import { Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageLoaderProps {
  isLoading: boolean;
  message?: string;
}

export default function PageLoader({ isLoading, message = 'Loading...' }: PageLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[9999] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-foreground font-semibold">{message}</p>
      </motion.div>
    </div>
  );
}
