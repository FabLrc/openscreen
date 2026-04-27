import { cn } from "@/lib/utils";

interface SubrowProps {
	children: React.ReactNode;
}

export default function Subrow({ children }: SubrowProps) {
	return (
		<div
			className={cn(
				"flex items-center min-h-[28px] gap-1 px-2 py-0.5 bg-white/[0.03] rounded text-slate-300",
			)}
		>
			{children}
		</div>
	);
}
