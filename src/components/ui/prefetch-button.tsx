"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import usePrefetchOnHover from '@/hooks/use-prefetch-on-hover';

type Props = React.ComponentProps<typeof Button> & {
  href: string;
};

export function PrefetchButton({ href, onMouseEnter, onFocus, children, ...props }: Props) {
  const { onEnter } = usePrefetchOnHover(href);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    onEnter();
    if (onMouseEnter) onMouseEnter(e as any);
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    onEnter();
    if (onFocus) onFocus(e as any);
  };

  return (
    <Button
      {...props}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onClick={props.onClick}
    >
      {children}
    </Button>
  );
}

export default PrefetchButton;
