import { cn } from "@/lib/utils";

type SchoolLogoProps = {
  /** Render size in pixels; defaults to a comfortable desktop footprint. */
  size?: number;
  className?: string;
};

export function SchoolLogo({ size = 64, className }: SchoolLogoProps) {
  return (
    <img
      src="/logo.png"
      width={size}
      height={size}
      alt="Montessori EM High School crest"
      draggable={false}
      className={cn(
        "object-contain select-none pointer-events-none drop-shadow-sm",
        className,
      )}
    />
  );
}
