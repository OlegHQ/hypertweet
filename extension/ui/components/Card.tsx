import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  className?: string;
}

export function Card({
  className = '',
  children,
  ...props
}: CardProps): React.ReactElement {
  return (
    <motion.div className={`ht-card ${className}`.trim()} {...props}>
      {children}
    </motion.div>
  );
}
