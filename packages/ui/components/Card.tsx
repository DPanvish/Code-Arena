import { cn } from "../utils/cn";

export const ClayCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "bg-clay-card backdrop-blur-md shadow-clay-card rounded-clay-card p-6 border border-white/40",
      className
    )}>
      {children}
    </div>
  );
};