import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  size?: "default" | "narrow" | "wide";
};

const sizeMap = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export default function Container({
  size = "default",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <div
      className={`mx-auto w-full px-6 sm:px-8 lg:px-12 ${sizeMap[size]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
