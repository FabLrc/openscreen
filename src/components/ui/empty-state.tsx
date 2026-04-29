import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	message: string;
	icon?: ReactNode;
	className?: string;
}

export function EmptyState({ message, icon, className }: EmptyStateProps) {
	return (
		<div className={cn("p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]", className)}>
			<div className="flex flex-col items-center gap-2">
				{icon && <span className="text-slate-400">{icon}</span>}
				<span className="text-[10px] text-slate-400 leading-relaxed block text-center">
					{message}
				</span>
			</div>
		</div>
	);
}
