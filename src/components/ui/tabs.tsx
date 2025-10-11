import * as React from "react";
import { cn } from "../../lib/utils";

export interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({ className, children, value, onValueChange, ...props }, ref) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex w-full flex-wrap gap-2 rounded-xl bg-slate-100 p-1 text-sm font-medium text-slate-600",
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsTrigger must be used within Tabs");
    }

    const isActive = context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabs-${value}`}
        disabled={disabled}
        className={cn(
          "flex-1 rounded-lg px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-akadeo-primary",
          isActive ? "bg-white text-slate-900 shadow" : "hover:bg-white/60",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => {
          if (!disabled) {
            context.onValueChange(value);
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsContent must be used within Tabs");
    }

    const isActive = context.value === value;

    if (!isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        id={`tabs-${value}`}
        role="tabpanel"
        className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
