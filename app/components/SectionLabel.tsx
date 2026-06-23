type Props = {
  number?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Section eyebrow modeled after the chapter labels in the brand guide.
 * Example: "S E R V I C E S · 0 1"
 */
export default function SectionLabel({ number, children, className = "" }: Props) {
  return (
    <p className={`brand-eyebrow flex items-center gap-3 ${className}`}>
      <span>{children}</span>
      {number && (
        <>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span>{number}</span>
        </>
      )}
    </p>
  );
}
