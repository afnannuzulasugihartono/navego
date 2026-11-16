import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Reveal({ children, as = 'div', delay = 0, className = '' }: { children: ReactNode; as?: 'div' | 'section'; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement | HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const node = ref.current;
    if (!node) { setShown(true); return; }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: React.CSSProperties = { transitionDelay: `${delay}ms` };
  const Tag = as === 'section' ? 'section' : 'div';
  return (
    <Tag ref={ref as never} className={`reveal${shown ? ' is-visible' : ''}${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </Tag>
  );
}
