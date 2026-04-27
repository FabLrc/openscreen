import type { RowDefinition } from "dnd-timeline";
import { useRow } from "dnd-timeline";
import type { ReactNode } from "react";

export type RowVariant = "zoom" | "trim" | "annotation" | "blur" | "speed";

const VARIANT_STYLES: Record<
	RowVariant,
	{ bg: string; border: string; iconColor: string; sidebarBg: string }
> = {
	zoom: {
		bg: "rgba(52,178,123,0.04)",
		border: "rgba(52,178,123,0.07)",
		iconColor: "#34B27B",
		sidebarBg: "rgba(52,178,123,0.06)",
	},
	trim: {
		bg: "rgba(239,68,68,0.04)",
		border: "rgba(239,68,68,0.07)",
		iconColor: "#ef4444",
		sidebarBg: "rgba(239,68,68,0.06)",
	},
	annotation: {
		bg: "rgba(180,160,70,0.04)",
		border: "rgba(180,160,70,0.07)",
		iconColor: "#B4A046",
		sidebarBg: "rgba(180,160,70,0.06)",
	},
	blur: {
		bg: "rgba(125,211,252,0.03)",
		border: "rgba(125,211,252,0.06)",
		iconColor: "#7dd3fc",
		sidebarBg: "rgba(125,211,252,0.05)",
	},
	speed: {
		bg: "rgba(217,119,6,0.04)",
		border: "rgba(217,119,6,0.07)",
		iconColor: "#d97706",
		sidebarBg: "rgba(217,119,6,0.06)",
	},
};

const SIDEBAR_WIDTH = 52;

interface RowProps extends RowDefinition {
	children: ReactNode;
	hint?: string;
	isEmpty?: boolean;
	variant?: RowVariant;
	icon?: ReactNode;
}

export default function Row({ id, children, hint, isEmpty, variant, icon }: RowProps) {
	const { setNodeRef, rowWrapperStyle, rowStyle } = useRow({ id });
	const vs = variant ? VARIANT_STYLES[variant] : null;

	return (
		<div
			className="relative"
			style={{
				...rowWrapperStyle,
				minHeight: 28,
				backgroundColor: vs?.bg ?? "transparent",
				borderBottom: `1px solid ${vs?.border ?? "rgba(255,255,255,0.03)"}`,
			}}
		>
			{/* Sidebar icon label */}
			<div
				className="absolute top-0 bottom-0 flex items-center justify-center z-20 pointer-events-none select-none"
				style={{
					width: SIDEBAR_WIDTH,
					left: 0,
					backgroundColor: vs?.sidebarBg ?? "transparent",
					borderRight: `1px solid ${vs?.border ?? "rgba(255,255,255,0.03)"}`,
				}}
			>
				{icon && <span style={{ color: vs?.iconColor ?? "#666", display: "flex" }}>{icon}</span>}
			</div>

			{/* Empty hint */}
			{isEmpty && hint && (
				<div
					className="absolute top-0 bottom-0 flex items-center pointer-events-none select-none z-10"
					style={{ left: SIDEBAR_WIDTH + 8, right: 8 }}
				>
					<span className="text-[10px] text-white/[0.12] font-medium">{hint}</span>
				</div>
			)}

			<div ref={setNodeRef} style={rowStyle}>
				{children}
			</div>
		</div>
	);
}

export { SIDEBAR_WIDTH };
