import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteButtonProps {
	onClick: () => void;
	label?: string;
	className?: string;
}

export function DeleteButton({ onClick, label = "Delete", className }: DeleteButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all",
				className,
			)}
		>
			<Trash2 className="w-3 h-3" />
			{label}
		</button>
	);
}
