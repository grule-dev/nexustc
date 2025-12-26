import { cn } from "@/lib/utils";

export function SearchContainer({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <main className="container w-full space-y-6 p-6 py-0">
      <h1 className="font-bold text-4xl">{label}</h1>
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {children}
      </div>
    </main>
  );
}

export function SearchResults({ children }: React.PropsWithChildren) {
  return <div className="md:col-span-2">{children}</div>;
}

export function SearchForm({
  ref,
  children,
  className,
  ...props
}: React.PropsWithChildren<React.ComponentProps<"form">>) {
  return (
    <form className={cn("row-start-1 md:row-start-auto", className)} {...props}>
      {children}
    </form>
  );
}
