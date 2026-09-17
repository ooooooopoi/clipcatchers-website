export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {/* The site's own heading voice, which the signed-in half of the
            product wasn't using. Every page in here was semibold sentence case
            — the register a component library ships with — while the public
            pages it sits behind are set heavy and uppercase. Two registers for
            one product reads as two products. */}
        <h1 className="display truncate text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
