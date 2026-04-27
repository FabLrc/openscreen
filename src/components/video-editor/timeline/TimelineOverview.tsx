import type { Range, Span } from "dnd-timeline";
import { useTimelineContext } from "dnd-timeline";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useRef } from "react";

interface OverviewRegion {
	id: string;
	span: Span;
	variant: "zoom" | "trim" | "annotation" | "speed" | "blur";
}

interface TimelineOverviewProps {
	regions: OverviewRegion[];
	currentTimeMs: number;
	videoDurationMs: number;
	viewportStartMs: number;
	viewportEndMs: number;
	onSeek?: (time: number) => void;
	onRangeChange?: Dispatch<SetStateAction<Range>>;
	children?: ReactNode;
}

const VARIANT_COLORS: Record<string, string> = {
	zoom: "#34B27B",
	trim: "#ef4444",
	annotation: "#B4A046",
	blur: "#7dd3fc",
	speed: "#d97706",
};

function pct(ms: number, totalMs: number): string {
	if (totalMs <= 0) return "0%";
	return `${Math.min(100, Math.max(0, (ms / totalMs) * 100))}%`;
}

export default function TimelineOverview({
	regions,
	currentTimeMs,
	videoDurationMs,
	viewportStartMs,
	viewportEndMs,
	onSeek,
	onRangeChange,
	children,
}: TimelineOverviewProps) {
	const { sidebarWidth } = useTimelineContext();

	// Viewport drag state
	const dragState = useRef<{
		startX: number;
		startMs: number;
		viewportSpanMs: number;
		trackWidth: number;
	} | null>(null);

	const handleViewportMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!onRangeChange || videoDurationMs <= 0) return;
			e.stopPropagation();
			e.preventDefault();
			const track = e.currentTarget.parentElement;
			if (!track) return;
			const trackWidth = track.getBoundingClientRect().width;
			dragState.current = {
				startX: e.clientX,
				startMs: viewportStartMs,
				viewportSpanMs: viewportEndMs - viewportStartMs,
				trackWidth,
			};

			function onMouseMove(ev: MouseEvent) {
				if (!dragState.current || !onRangeChange) return;
				const { startX, startMs, viewportSpanMs, trackWidth } = dragState.current;
				const deltaX = ev.clientX - startX;
				const deltaMs = (deltaX / trackWidth) * videoDurationMs;
				const newStart = Math.max(0, Math.min(startMs + deltaMs, videoDurationMs - viewportSpanMs));
				const newEnd = newStart + viewportSpanMs;
				onRangeChange(() => ({ start: newStart, end: newEnd }));
			}

			function onMouseUp() {
				dragState.current = null;
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
			}

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		},
		[onRangeChange, videoDurationMs, viewportStartMs, viewportEndMs],
	);

	function handleClick(e: React.MouseEvent<HTMLDivElement>) {
		if (!onSeek || videoDurationMs <= 0) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const ratio = Math.min(1, Math.max(0, clickX / rect.width));
		const clampedMs = ratio * videoDurationMs;
		onSeek(clampedMs / 1000);
	}

	if (videoDurationMs <= 0) {
		return (
			<div
				className="h-10 bg-[#06060b] border-b border-white/5 relative"
				style={{ marginLeft: sidebarWidth }}
			/>
		);
	}

	const playheadLeft = pct(currentTimeMs, videoDurationMs);
	const viewportLeft = pct(viewportStartMs, videoDurationMs);
	const viewportWidth = `${Math.max(0, ((viewportEndMs - viewportStartMs) / videoDurationMs) * 100)}%`;

	return (
		<div
			className="h-6 bg-[#06060b] border-b border-white/5 relative shrink-0"
			style={{ paddingLeft: sidebarWidth }}
		>
			<div
				className="absolute inset-y-0 cursor-pointer group"
				style={{ left: sidebarWidth, right: 0 }}
				onClick={handleClick}
			>
				{/* Background track */}
				<div className="absolute inset-0 bg-white/[0.02]" />

				{/* Region blocks */}
				{regions.map((region) => {
					const left = pct(region.span.start, videoDurationMs);
					const width = `${Math.max(0.2, ((region.span.end - region.span.start) / videoDurationMs) * 100)}%`;
					const color = VARIANT_COLORS[region.variant] ?? "#666";

					return (
						<div
							key={region.id}
							className="absolute top-[1px] bottom-[1px] rounded-sm opacity-70 group-hover:opacity-90 transition-opacity"
							style={{
								left,
								width,
								backgroundColor: color,
							}}
						/>
					);
				})}

				{/* Viewport indicator — draggable */}
				<div
					className="absolute top-0 bottom-0 border border-white/30 bg-white/[0.06] rounded-sm cursor-grab active:cursor-grabbing hover:bg-white/[0.10] transition-colors"
					style={{
						left: viewportLeft,
						width: viewportWidth,
					}}
					onMouseDown={handleViewportMouseDown}
				/>

				{/* Playhead */}
				<div
					className="absolute top-0 bottom-0 w-[2px] bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.3)] pointer-events-none"
					style={{ left: playheadLeft }}
				/>

				{children}
			</div>
		</div>
	);
}
