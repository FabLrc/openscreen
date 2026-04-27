import { Sparkles, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useScopedT } from "@/contexts/I18nContext";
import type { PlaybackSpeed, ZoomDepth, ZoomFocusMode } from "../types";
import { SPEED_OPTIONS } from "../types";

interface PanelVisualProps {
	selectedZoomDepth?: ZoomDepth | null;
	onZoomDepthChange?: (depth: ZoomDepth) => void;
	selectedZoomFocusMode?: ZoomFocusMode | null;
	onZoomFocusModeChange?: (mode: ZoomFocusMode) => void;
	hasCursorTelemetry?: boolean;
	selectedZoomId?: string | null;
	onZoomDelete?: (id: string) => void;
	selectedTrimId?: string | null;
	onTrimDelete?: (id: string) => void;
	selectedSpeedId?: string | null;
	selectedSpeedValue?: PlaybackSpeed | null;
	onSpeedChange?: (speed: PlaybackSpeed) => void;
	onSpeedDelete?: (id: string) => void;
	showBlur?: boolean;
	onBlurChange?: (showBlur: boolean) => void;
	motionBlurAmount?: number;
	onMotionBlurChange?: (amount: number) => void;
	onMotionBlurCommit?: () => void;
	shadowIntensity?: number;
	onShadowChange?: (intensity: number) => void;
	onShadowCommit?: () => void;
	borderRadius?: number;
	onBorderRadiusChange?: (radius: number) => void;
	onBorderRadiusCommit?: () => void;
	padding?: number;
	onPaddingChange?: (padding: number) => void;
	onPaddingCommit?: () => void;
}

const ZOOM_DEPTH_OPTIONS: Array<{ depth: ZoomDepth; label: string }> = [
	{ depth: 1, label: "1.25×" },
	{ depth: 2, label: "1.5×" },
	{ depth: 3, label: "1.8×" },
	{ depth: 4, label: "2.2×" },
	{ depth: 5, label: "3.5×" },
	{ depth: 6, label: "5×" },
];

function SpeedChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`
				h-auto w-full rounded-lg border px-1 py-2 text-center shadow-sm transition-all text-xs font-semibold
				${active ? "border-[#34B27B] bg-[#34B27B] text-white shadow-[#34B27B]/20" : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200"}
			`}
		>
			{children}
		</button>
	);
}

export default function PanelVisual({
	selectedZoomDepth,
	onZoomDepthChange,
	selectedZoomFocusMode,
	onZoomFocusModeChange,
	hasCursorTelemetry = false,
	selectedZoomId,
	onZoomDelete,
	selectedTrimId,
	onTrimDelete,
	selectedSpeedId,
	selectedSpeedValue,
	onSpeedChange,
	onSpeedDelete,
	showBlur,
	onBlurChange,
	motionBlurAmount = 0,
	onMotionBlurChange,
	onMotionBlurCommit,
	shadowIntensity = 0,
	onShadowChange,
	onShadowCommit,
	borderRadius = 0,
	onBorderRadiusChange,
	onBorderRadiusCommit,
	padding = 50,
	onPaddingChange,
	onPaddingCommit,
}: PanelVisualProps) {
	const t = useScopedT("settings");
	const zoomEnabled = Boolean(selectedZoomDepth);
	const trimEnabled = Boolean(selectedTrimId);

	return (
		<div className="space-y-4">
			{/* Zoom */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-semibold text-slate-200">{t("zoom.level")}</span>
					{zoomEnabled && selectedZoomDepth && (
						<span className="text-[10px] uppercase tracking-wider font-medium text-[#34B27B] bg-[#34B27B]/10 px-2 py-0.5 rounded-full">
							{ZOOM_DEPTH_OPTIONS.find((o) => o.depth === selectedZoomDepth)?.label}
						</span>
					)}
				</div>
				<div className="grid grid-cols-6 gap-1.5">
					{ZOOM_DEPTH_OPTIONS.map((option) => (
						<button
							key={option.depth}
							type="button"
							disabled={!zoomEnabled}
							onClick={() => onZoomDepthChange?.(option.depth)}
							className={`
								h-auto w-full rounded-lg border px-1 py-2 text-center shadow-sm transition-all text-xs font-semibold
								${zoomEnabled ? "opacity-100 cursor-pointer" : "opacity-40 cursor-not-allowed"}
								${
									selectedZoomDepth === option.depth
										? "border-[#34B27B] bg-[#34B27B] text-white shadow-[#34B27B]/20"
										: "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200"
								}
							`}
						>
							{option.label}
						</button>
					))}
				</div>
				{!zoomEnabled && (
					<p className="text-[10px] text-slate-500 mt-2 text-center">{t("zoom.selectRegion")}</p>
				)}
				{zoomEnabled && hasCursorTelemetry && (
					<div className="mt-3">
						<span className="text-xs font-medium text-slate-200 mb-2 block">
							{t("zoom.focusMode.title")}
						</span>
						<div className="grid grid-cols-2 gap-1.5">
							{(["manual", "auto"] as const).map((mode) => (
								<button
									key={mode}
									type="button"
									onClick={() => onZoomFocusModeChange?.(mode)}
									className={`
										h-auto w-full rounded-lg border px-2 py-2 text-center shadow-sm transition-all text-xs font-semibold capitalize cursor-pointer
										${
											selectedZoomFocusMode === mode
												? "border-[#34B27B] bg-[#34B27B] text-white shadow-[#34B27B]/20"
												: "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200"
										}
									`}
								>
									{t(`zoom.focusMode.${mode}`)}
								</button>
							))}
						</div>
					</div>
				)}
				{zoomEnabled && (
					<button
						onClick={() => selectedZoomId && onZoomDelete?.(selectedZoomId)}
						className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all"
					>
						<Trash2 className="w-3 h-3" />
						{t("zoom.deleteZoom")}
					</button>
				)}
			</div>

			{/* Trim */}
			{trimEnabled && (
				<button
					onClick={() => selectedTrimId && onTrimDelete?.(selectedTrimId)}
					className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all"
				>
					<Trash2 className="w-3 h-3" />
					{t("trim.deleteRegion")}
				</button>
			)}

			{/* Speed */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-semibold text-slate-200">{t("speed.playbackSpeed")}</span>
					{selectedSpeedId && selectedSpeedValue && (
						<span className="text-[10px] uppercase tracking-wider font-medium text-[#d97706] bg-[#d97706]/10 px-2 py-0.5 rounded-full">
							{SPEED_OPTIONS.find((o) => o.speed === selectedSpeedValue)?.label ??
								`${selectedSpeedValue}×`}
						</span>
					)}
				</div>
				<div className="grid grid-cols-5 gap-1.5">
					{SPEED_OPTIONS.map((option) => (
						<SpeedChip
							key={option.speed}
							active={selectedSpeedValue === option.speed}
							onClick={() => onSpeedChange?.(option.speed)}
						>
							{option.label}
						</SpeedChip>
					))}
				</div>
				{!selectedSpeedId && (
					<p className="text-[10px] text-slate-500 mt-2 text-center">{t("speed.selectRegion")}</p>
				)}
				{selectedSpeedId && (
					<button
						onClick={() => selectedSpeedId && onSpeedDelete?.(selectedSpeedId)}
						className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all"
					>
						<Trash2 className="w-3 h-3" />
						{t("speed.deleteRegion")}
					</button>
				)}
			</div>

			{/* Effects */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Sparkles className="w-3.5 h-3.5 text-[#34B27B]" />
					<span className="text-xs font-semibold text-slate-200">{t("effects.title")}</span>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
						<span className="text-[10px] font-medium text-slate-300">{t("effects.blurBg")}</span>
						<button
							type="button"
							onClick={() => onBlurChange?.(!showBlur)}
							className={`
								w-8 h-[18px] rounded-full relative transition-all border cursor-pointer
								${showBlur ? "bg-[#34B27B] border-[#34B27B]" : "bg-white/10 border-white/10"}
							`}
						>
							<div
								className={`
								absolute top-0.5 w-[10px] h-[10px] bg-white rounded-full shadow transition-all
								${showBlur ? "left-[calc(100%-12px)]" : "left-0.5"}
							`}
							/>
						</button>
					</div>

					{[
						{
							label: t("effects.motionBlur"),
							value: motionBlurAmount,
							onChange: onMotionBlurChange,
							onCommit: onMotionBlurCommit,
							min: 0,
							max: 1,
							step: 0.01,
							suffix: "",
						},
						{
							label: t("effects.shadow"),
							value: shadowIntensity,
							onChange: onShadowChange,
							onCommit: onShadowCommit,
							min: 0,
							max: 1,
							step: 0.01,
							suffix: "%",
							display: (v: number) => Math.round(v * 100),
						},
						{
							label: t("effects.roundness"),
							value: borderRadius,
							onChange: onBorderRadiusChange,
							onCommit: onBorderRadiusCommit,
							min: 0,
							max: 16,
							step: 0.5,
							suffix: "px",
						},
						{
							label: t("effects.padding"),
							value: padding,
							onChange: onPaddingChange,
							onCommit: onPaddingCommit,
							min: 0,
							max: 100,
							step: 1,
							suffix: "%",
						},
					].map(({ label, value, onChange, onCommit, min, max, step, suffix, display }) => (
						<div key={label} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
							<div className="flex items-center justify-between mb-1">
								<span className="text-[10px] font-medium text-slate-300">{label}</span>
								<span className="text-[10px] text-slate-500 font-mono">
									{display
										? display(value as number)
										: (value as number) === 0
											? t("effects.off")
											: (value as number).toFixed(2)}
									{suffix}
								</span>
							</div>
							<Slider
								value={[value as number]}
								onValueChange={(values: number[]) => onChange?.(values[0])}
								onValueCommit={() => onCommit?.()}
								min={min}
								max={max}
								step={step}
								className="w-full [&_[role=slider]]:bg-[#34B27B] [&_[role=slider]]:border-[#34B27B] [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
