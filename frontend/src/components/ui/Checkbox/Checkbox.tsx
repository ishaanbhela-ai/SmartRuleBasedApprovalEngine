import * as React from "react"
import { cn } from "../../../lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, id, ...props }, ref) => {
        const generatedId = React.useId()
        const checkboxId = id || generatedId

        return (
            <div className="flex items-center space-x-2">
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        id={checkboxId}
                        ref={ref}
                        className="peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-slate-300 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary-600 checked:border-primary-600"
                        {...props}
                    />
                    <Check className="pointer-events-none absolute left-0 top-0 hidden h-4 w-4 text-black peer-checked:block" />
                </div>
                {label && (
                    <label
                        htmlFor={checkboxId}
                        className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700",
                            className
                        )}
                    >
                        {label}
                    </label>
                )}
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
