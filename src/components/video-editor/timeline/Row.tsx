import type { RowDefinition } from "dnd-timeline";
import { useRow } from "dnd-timeline";
import type { ReactNode } from "react";
import type { RowVariant } from "../types";

export type { RowVariant };

const VARIANT_STYLES: Record<
	RowVariant,
	{ bg: string; border: string; dot: string; sidebarBg: string }
> = {
	zoom: {
		bg: "rgba(52,178,123,0.04)",
		border: "rgba(52,178,123,0.07)",
		dot: "#34B27B",
		sidebarBg: "rgba(52,178,123,0.06)",
	},
	trim: {
		bg: "rgba(239,68,68,0.04)",
		border: "rgba(239,68,68,0.07)",
		dot: "#ef4444",
		sidebarBg: "rgba(239,68,68,0.06)",
	},
	annotation: {
		bg: "rgba(180,160,70,0.04)",
		border: "rgba(180,160,70,0.07)",
		dot: "#B4A046",
		sidebarBg: "rgba(180,160,70,0.06)",
	},
	blur: {
		bg: "rgba(125,211,252,0.03)",
		border: "rgba(125,211,252,0.06)",
		dot: "#7dd3fc",
		sidebarBg: "rgba(125,211,252,0.05)",
	},
	speed: {
		bg: "rgba(217,119,6,0.04)",
		border: "rgba(217,119,6,0.07)",
		dot: "#d97706",
		sidebarBg: "rgba(217,119,6,0.06)",
	},
};

const SIDEBAR_WIDTH = 68;

interface RowProps extends RowDefinition {
	children: ReactNode;
	hint?: string;
	isEmpty?: boolean;
	variant?: RowVariant;
	label?: string;
}

export default function Row({ id, children, hint, isEmpty, variant, label }: RowProps) {
	const { setNodeRef, rowWrapperStyle, rowStyle } = useRow({ id });
	const vs = variant ? VARIANT_STYLES[variant] : null;

	return (
		<div
			className="relative"
			style={{
				...rowWrapperStyle,
				flex: "1 1 0%",
				minHeight: 28,
				backgroundColor: vs?.bg ?? "transparent",
				borderBottom: `1px solid ${vs?.border ?? "rgba(255,255,255,0.03)"}`,
			}}
		>
			{/* Sidebar: dot + label */}
			<div
				className="absolute top-0 bottom-0 flex items-center z-20 pointer-events-none select-none"
				style={{
					width: SIDEBAR_WIDTH,
					left: 0,
					backgroundColor: vs?.sidebarBg ?? "transparent",
					borderRight: `1px solid ${vs?.border ?? "rgba(255,255,255,0.03)"}`,
				}}
			>
				{vs && (
					<div
						style={{
							width: 5,
							height: 5,
							borderRadius: "50%",
							backgroundColor: vs.dot,
							flexShrink: 0,
							opacity: 0.75,
							marginLeft: 8,
						}}
					/>
				)}
				{label && (
					<span
						style={{
							fontSize: 9,
							color: "rgba(255,255,255,0.28)",
							fontWeight: 500,
							flex: 1,
							textAlign: "right",
							overflow: "hidden",
							whiteSpace: "nowrap",
							letterSpacing: "0.04em",
							marginRight: 7,
							marginLeft: 4,
							textTransform: "uppercase",
						}}
					>
						{label}
					</span>
				)}
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
