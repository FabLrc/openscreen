import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const thumbSizeMap = {
	sm: "h-3 w-3",
	md: "h-4 w-4",
};

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
	size?: "sm" | "md";
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
	({ className, size = "md", ...props }, ref) => (
		<SliderPrimitive.Root
			ref={ref}
			className={cn("relative flex w-full touch-none select-none items-center", className)}
			{...props}
		>
			<SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
				<SliderPrimitive.Range className="absolute h-full bg-brand" />
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				className={cn(
					"block rounded-full border-2 border-brand bg-brand shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50",
					thumbSizeMap[size],
				)}
			/>
		</SliderPrimitive.Root>
	),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
