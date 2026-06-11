type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 ${className}`}
    >
      {children}
    </span>
  );
}
