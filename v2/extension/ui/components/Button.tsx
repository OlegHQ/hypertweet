import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}: ButtonProps): React.ReactElement {
  const sizeClass = size === 'default' ? '' : `ht-btn-${size}`;
  const classes = `ht-btn ht-btn-${variant} ${sizeClass} ${className}`.trim();

  return (
    <motion.button className={classes} whileTap={{ scale: 0.98 }} {...props}>
      {children}
    </motion.button>
  );
}
