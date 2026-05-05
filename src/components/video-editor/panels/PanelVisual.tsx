import { ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useScopedT } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import ColorPicker from "../../ui/color-picker";
import type { PlaybackSpeed, Rotation3DPreset, ZoomDepth, ZoomFocusMode } from "../types";
import { ROTATION_3D_PRESET_ORDER, SPEED_OPTIONS } from "../types";
import type { CursorHighlightConfig } from "../videoPlayback/cursorHighlight";

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
	selectedZoomRotationPreset?: Rotation3DPreset | null;
	onZoomRotationPresetChange?: (preset: Rotation3DPreset | null) => void;
	cursorHighlight?: CursorHighlightConfig;
	onCursorHighlightChange?: (next: CursorHighlightConfig) => void;
	cursorHighlightSupportsClicks?: boolean;
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
	disabled,
	onClick,
	children,
}: {
	active: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={`
				h-auto w-full rounded-lg border px-1 py-2 text-center shadow-sm transition-all text-xs font-semibold
				${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
				${active ? "border-brand bg-brand text-white shadow-brand/20" : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200"}
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
	selectedZoomRotationPreset,
	onZoomRotationPresetChange,
	cursorHighlight,
	onCursorHighlightChange,
	cursorHighlightSupportsClicks = false,
}: PanelVisualProps) {
	const t = useScopedT("settings");
	const zoomEnabled = Boolean(selectedZoomDepth);
	const trimEnabled = Boolean(selectedTrimId);

	const colorPalette = [
		"#FF0000",
		"#FFD700",
		"#00FF00",
		"#FFFFFF",
		"#0000FF",
		"#FF6B00",
		"#9B59B6",
		"#E91E63",
		"#00BCD4",
		"#FF5722",
		"#8BC34A",
		"#FFC107",
		"#34B27B",
		"#000000",
		"#607D8B",
		"#795548",
	];

	return (
		<div className="space-y-4">
			{/* Zoom */}
			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-semibold text-slate-200">{t("zoom.level")}</span>
					{zoomEnabled && selectedZoomDepth && (
						<span className="text-[10px] uppercase tracking-wider font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
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
										? "border-brand bg-brand text-white shadow-brand/20"
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
												? "border-brand bg-brand text-white shadow-brand/20"
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
					<div className="mt-4">
						<span className="text-xs font-medium text-slate-200 mb-2 block">
							{t("zoom.threeD.title")}
						</span>
						<div className="grid grid-cols-3 gap-1.5">
							{ROTATION_3D_PRESET_ORDER.map((preset) => {
								const isActive = selectedZoomRotationPreset === preset;
								return (
									<button
										key={preset}
										type="button"
										onClick={() => onZoomRotationPresetChange?.(isActive ? null : preset)}
										className={cn(
											"h-auto w-full rounded-lg border px-1 py-2 text-center shadow-sm transition-all duration-200 ease-out cursor-pointer text-xs font-semibold capitalize",
											isActive
												? "border-brand bg-brand text-white shadow-brand/20"
												: "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 hover:text-slate-200",
										)}
									>
										{t(`zoom.threeD.preset.${preset}`)}
									</button>
								);
							})}
						</div>
					</div>
				)}
				{zoomEnabled && (
					<DeleteButton
						onClick={() => selectedZoomId && onZoomDelete?.(selectedZoomId)}
						label={t("zoom.deleteZoom")}
						className="mt-2"
					/>
				)}
			</div>

			{/* Trim */}
			{trimEnabled && (
				<DeleteButton
					onClick={() => selectedTrimId && onTrimDelete?.(selectedTrimId)}
					label={t("trim.deleteRegion")}
				/>
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
							disabled={!selectedSpeedId}
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
					<DeleteButton
						onClick={() => selectedSpeedId && onSpeedDelete?.(selectedSpeedId)}
						label={t("speed.deleteRegion")}
						className="mt-2"
					/>
				)}
			</div>

			{/* Effects */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Sparkles className="w-3.5 h-3.5 text-brand" />
					<span className="text-xs font-semibold text-slate-200">{t("effects.title")}</span>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
						<span className="text-[10px] font-medium text-slate-300">{t("effects.blurBg")}</span>
						<Switch checked={showBlur} onCheckedChange={(v) => onBlurChange?.(v)} />
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
										? `${display(value as number)}${suffix}`
										: (value as number) === 0
											? t("effects.off")
											: `${Number.isInteger(value as number) ? value : (value as number).toFixed(2)}${suffix}`}
								</span>
							</div>
							<Slider
								value={[value as number]}
								onValueChange={(values: number[]) => onChange?.(values[0])}
								onValueCommit={() => onCommit?.()}
								min={min}
								max={max}
								step={step}
								size="sm"
							/>
						</div>
					))}
				</div>
			</div>

			{/* Cursor highlight */}
			{cursorHighlight && onCursorHighlightChange && (
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Sparkles className="w-3.5 h-3.5 text-brand" />
						<span className="text-xs font-semibold text-slate-200">Cursor</span>
					</div>
					<div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-medium text-slate-300">Cursor highlight</span>
							<button
								type="button"
								onClick={() =>
									onCursorHighlightChange({
										...cursorHighlight,
										enabled: !cursorHighlight.enabled,
									})
								}
								className={cn(
									"text-[10px] px-2 py-0.5 rounded border transition-colors",
									cursorHighlight.enabled
										? "bg-brand/20 border-brand/50 text-brand"
										: "bg-white/5 border-white/10 text-slate-400",
								)}
							>
								{cursorHighlight.enabled ? "On" : "Off"}
							</button>
						</div>
						<div
							className={cn(
								"grid grid-cols-2 gap-1",
								!cursorHighlight.enabled && "opacity-40 pointer-events-none",
							)}
						>
							{(["dot", "ring"] as const).map((style) => (
								<button
									key={style}
									type="button"
									onClick={() => onCursorHighlightChange({ ...cursorHighlight, style })}
									className={cn(
										"text-[10px] px-2 py-1 rounded border capitalize transition-colors",
										cursorHighlight.style === style
											? "bg-brand/20 border-brand/50 text-brand"
											: "bg-white/5 border-white/10 text-slate-300 hover:border-white/20",
									)}
								>
									{style}
								</button>
							))}
						</div>
						<div className={cn(!cursorHighlight.enabled && "opacity-40 pointer-events-none")}>
							<div className="flex items-center justify-between mb-1">
								<span className="text-[10px] text-slate-400">Size</span>
								<span className="text-[10px] text-slate-500 font-mono">
									{cursorHighlight.sizePx}px
								</span>
							</div>
							<Slider
								value={[cursorHighlight.sizePx]}
								onValueChange={(values: number[]) =>
									onCursorHighlightChange({ ...cursorHighlight, sizePx: values[0] })
								}
								min={10}
								max={36}
								step={1}
								size="sm"
							/>
						</div>
						{cursorHighlightSupportsClicks && (
							<div
								className={cn(
									"flex items-center justify-between",
									!cursorHighlight.enabled && "opacity-40 pointer-events-none",
								)}
							>
								<span className="text-[10px] text-slate-400">Only on clicks</span>
								<button
									type="button"
									onClick={async () => {
										const turningOn = !cursorHighlight.onlyOnClicks;
										if (turningOn) {
											try {
												const result = await window.electronAPI.requestAccessibilityAccess();
												if (!result.granted) {
													toast.message("Accessibility permission needed", {
														description:
															"Open System Settings → Privacy & Security → Accessibility, enable Openscreen, then restart the app.",
													});
												}
											} catch (err) {
												console.warn("Accessibility request failed:", err);
											}
										}
										onCursorHighlightChange({
											...cursorHighlight,
											onlyOnClicks: turningOn,
										});
									}}
									className={cn(
										"text-[10px] px-2 py-0.5 rounded border transition-colors",
										cursorHighlight.onlyOnClicks
											? "bg-brand/20 border-brand/50 text-brand"
											: "bg-white/5 border-white/10 text-slate-400",
									)}
								>
									{cursorHighlight.onlyOnClicks ? "On" : "Off"}
								</button>
							</div>
						)}
						<div className={cn(!cursorHighlight.enabled && "opacity-40 pointer-events-none")}>
							<span className="text-[10px] text-slate-400 mb-1 block">Color</span>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full h-8 justify-start gap-2 bg-white/5 border-white/10 hover:bg-white/10 px-2"
									>
										<div
											className="w-4 h-4 rounded-full border border-white/20"
											style={{ backgroundColor: cursorHighlight.color }}
										/>
										<span className="text-[10px] text-slate-300 truncate flex-1 text-left font-mono">
											{cursorHighlight.color}
										</span>
										<ChevronDown className="h-3 w-3 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									side="top"
									className="w-[260px] p-3 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-xl"
								>
									<ColorPicker
										selectedColor={cursorHighlight.color}
										colorPalette={colorPalette}
										translations={{
											colorWheel: t("background.colorWheel"),
											colorPalette: t("background.colorPalette"),
										}}
										onUpdateColor={(color) =>
											onCursorHighlightChange({ ...cursorHighlight, color })
										}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div className={cn(!cursorHighlight.enabled && "opacity-40 pointer-events-none")}>
							<div className="flex items-center justify-between mb-1">
								<span className="text-[10px] text-slate-400">Offset X</span>
								<span className="text-[10px] text-slate-500 font-mono">
									{(cursorHighlight.offsetXNorm * 100).toFixed(1)}%
								</span>
							</div>
							<Slider
								value={[cursorHighlight.offsetXNorm]}
								onValueChange={(values: number[]) =>
									onCursorHighlightChange({ ...cursorHighlight, offsetXNorm: values[0] })
								}
								min={-0.25}
								max={0.25}
								step={0.005}
								size="sm"
							/>
						</div>
						<div className={cn(!cursorHighlight.enabled && "opacity-40 pointer-events-none")}>
							<div className="flex items-center justify-between mb-1">
								<span className="text-[10px] text-slate-400">Offset Y</span>
								<span className="text-[10px] text-slate-500 font-mono">
									{(cursorHighlight.offsetYNorm * 100).toFixed(1)}%
								</span>
							</div>
							<Slider
								value={[cursorHighlight.offsetYNorm]}
								onValueChange={(values: number[]) =>
									onCursorHighlightChange({ ...cursorHighlight, offsetYNorm: values[0] })
								}
								min={-0.25}
								max={0.25}
								step={0.005}
								size="sm"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
