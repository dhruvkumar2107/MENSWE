import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatINR, percentOff } from "@/lib/money";

type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.18em] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-gold";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-obsidian text-ivory hover:bg-charcoal",
  gold: "bg-gold text-obsidian hover:bg-gold-deep hover:text-ivory",
  outline: "border border-obsidian text-obsidian hover:bg-obsidian hover:text-ivory",
  ghost: "text-obsidian hover:bg-sand",
  danger: "bg-danger text-white hover:opacity-90",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-6 text-xs",
  lg: "h-14 px-9 text-[13px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

type BadgeTone = "gold" | "obsidian" | "ivory" | "sale" | "muted" | "success" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  gold: "bg-gold text-obsidian",
  obsidian: "bg-obsidian text-ivory",
  ivory: "bg-ivory text-obsidian border border-line",
  sale: "bg-danger text-white",
  muted: "bg-sand text-graphite",
  success: "bg-success text-white",
  danger: "bg-danger text-white",
};

export function Badge({
  tone = "ivory",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[11px] font-medium uppercase tracking-[0.16em] text-graphite">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <span className="text-xs text-graphite">{hint}</span>}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

export const inputClass =
  "w-full h-11 border border-line bg-white px-3.5 text-sm text-obsidian placeholder:text-graphite/60 transition-colors focus:border-obsidian focus:outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "h-auto min-h-[96px] py-2.5", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputClass, "cursor-pointer appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function PriceTag({
  price,
  salePrice,
  className,
  size = "md",
}: {
  price: number;
  salePrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const off = percentOff(price, salePrice);
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  } as const;
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-medium", sizes[size])}>{formatINR(salePrice ?? price)}</span>
      {off > 0 && (
        <>
          <span className="text-graphite line-through text-xs">{formatINR(price)}</span>
          <span className="text-danger text-xs font-semibold">{off}% OFF</span>
        </>
      )}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 mb-10",
        align === "center" ? "items-center text-center" : "items-start",
        action && "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={cn("flex flex-col gap-2", align === "center" && "items-center")}>
        {eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">{eyebrow}</span>
        )}
        <h2 className="text-3xl sm:text-4xl font-display tracking-tight">{title}</h2>
        {description && <p className="max-w-2xl text-sm text-graphite">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 border border-line bg-white px-8 py-20 text-center">
      <h3 className="font-display text-2xl">{title}</h3>
      {description && <p className="max-w-md text-sm text-graphite">{description}</p>}
      {action}
    </div>
  );
}
