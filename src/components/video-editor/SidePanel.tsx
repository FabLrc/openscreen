import { X } from "lucide-react";
import { useCallback, useRef } from "react";
import { TABS } from "./TabRail";

interface SidePanelProps {
	activeTab: string | null;
	onClose: () => void;
	children?: React.ReactNode;
	width: number;
	onWidthChange: (width: number) => void;
}

export default function SidePanel({
	activeTab,
	onClose,
	children,
	width,
	onWidthChange,
}: SidePanelProps) {
	const dragState = useRef<{
		startX: number;
		startWidth: number;
	} | null>(null);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			dragState.current = { startX: e.clientX, startWidth: width };

			function onPointerMove(ev: PointerEvent) {
				if (!dragState.current) return;
				const delta = dragState.current.startX - ev.clientX;
				const newWidth = Math.max(180, Math.min(400, dragState.current.startWidth + delta));
				onWidthChange(newWidth);
			}

			function onPointerUp() {
				dragState.current = null;
				window.removeEventListener("pointermove", onPointerMove);
				window.removeEventListener("pointerup", onPointerUp);
			}

			window.addEventListener("pointermove", onPointerMove);
			window.addEventListener("pointerup", onPointerUp);
		},
		[width, onWidthChange],
	);

	const tab = TABS.find((t) => t.id === activeTab);
	if (!tab) return null;

	return (
		<div
			className="bg-[#0e0e18] border-l border-white/[0.06] flex flex-col overflow-hidden flex-shrink-0 shadow-[-8px_0_24px_rgba(0,0,0,0.25)] relative"
			style={{ width }}
		>
			{/* Resize handle */}
			<div
				className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/20 active:bg-white/30 transition-colors z-10"
				onPointerDown={handlePointerDown}
			/>
			{/* Header */}
			<div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center gap-2 flex-shrink-0">
				<span className="text-brand">{tab.icon}</span>
				<span className="text-[13px] font-semibold text-[#eceff6]">{tab.label}</span>
				<button
					type="button"
					onClick={onClose}
					className="ml-auto w-[22px] h-[22px] rounded-[5px] border border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/70 flex items-center justify-center transition-colors"
				>
					<X size={14} />
				</button>
			</div>
			{/* Content */}
			<div className="flex-1 overflow-y-auto px-3.5 py-3 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:bg-white/[0.08] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
				{children}
			</div>
		</div>
	);
}
