import { useGlobalState } from "./state";
import { Button } from "./library/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  backRoute: string;
}

export function PageHeader({ title, backRoute }: PageHeaderProps) {
  const { setCurrentRoute } = useGlobalState();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 mb-8"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCurrentRoute(backRoute)}
        className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </Button>
      <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
        {title}
      </h1>
    </motion.div>
  );
}
