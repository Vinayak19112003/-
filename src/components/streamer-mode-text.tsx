
'use client';

import { useStreamerMode } from '@/contexts/streamer-mode-context';
import { cn } from '@/lib/utils';

type StreamerModeTextProps = {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
};

export function StreamerModeText({ children, className, as: Component = 'span' }: StreamerModeTextProps) {
  const { isStreamerMode } = useStreamerMode();

  return (
    <Component className={cn(
      'transition-all duration-300',
      isStreamerMode ? 'blur-sm select-none' : 'blur-none',
      className
    )}>
      {children}
    </Component>
  );
}
