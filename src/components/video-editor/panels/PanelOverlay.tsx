import { Sparkles } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useScopedT } from "@/contexts/I18nContext";
import { WEBCAM_LAYOUT_PRESETS } from "@/lib/compositeLayout";
import { cn } from "@/lib/utils";
import { isPortraitAspectRatio } from "@/utils/aspectRatioUtils";
import type { WebcamLayoutPreset, WebcamMaskShape, WebcamSizePreset } from "../types";
import { DEFAULT_WEBCAM_SIZE_PRESET } from "../types";

interface PanelOverlayProps {
	hasWebcam?: boolean;
	webcamLayoutPreset?: WebcamLayoutPreset;
	onWebcamLayoutPresetChange?: (preset: WebcamLayoutPreset) => void;
	webcamMaskShape?: WebcamMaskShape;
	onWebcamMaskShapeChange?: (shape: WebcamMaskShape) => void;
	webcamSizePreset?: WebcamSizePreset;
	onWebcamSizePresetChange?: (size: WebcamSizePreset) => void;
	onWebcamSizePresetCommit?: () => void;
	aspectRatio?: string;
}

export default function PanelOverlay({
	hasWebcam = false,
	webcamLayoutPreset = "picture-in-picture",
	onWebcamLayoutPresetChange,
	webcamMaskShape = "rectangle",
	onWebcamMaskShapeChange,
	webcamSizePreset = DEFAULT_WEBCAM_SIZE_PRESET,
	onWebcamSizePresetChange,
	onWebcamSizePresetCommit,
	aspectRatio = "16:9",
}: PanelOverlayProps) {
	const t = useScopedT("settings");
	const isPortraitCanvas = isPortraitAspectRatio(
		aspectRatio as "16:9" | "4:3" | "1:1" | "9:16" | "native",
	);

	return (
		<div className="space-y-4">
			{hasWebcam && (
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Sparkles className="w-3.5 h-3.5 text-[#34B27B]" />
						<span className="text-xs font-semibold text-slate-200">{t("layout.title")}</span>
					</div>
					<div className="space-y-2">
						{/* Preset */}
						<div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
							<div className="text-[10px] font-medium text-slate-300 mb-1">
								{t("layout.preset")}
							</div>
							<Select
								value={webcamLayoutPreset}
								onValueChange={(value: WebcamLayoutPreset) => onWebcamLayoutPresetChange?.(value)}
							>
								<SelectTrigger className="h-8 bg-black/20 border-white/10 text-xs">
									<SelectValue placeholder={t("layout.selectPreset")} />
								</SelectTrigger>
								<SelectContent>
									{WEBCAM_LAYOUT_PRESETS.filter((preset) => {
										if (preset.value === "picture-in-picture") return true;
										if (preset.value === "vertical-stack") return isPortraitCanvas;
										return !isPortraitCanvas;
									}).map((preset) => (
										<SelectItem key={preset.value} value={preset.value} className="text-xs">
											{preset.value === "picture-in-picture"
												? t("layout.pictureInPicture")
												: preset.value === "vertical-stack"
													? t("layout.verticalStack")
													: t("layout.dualFrame")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Shape */}
						{webcamLayoutPreset === "picture-in-picture" && (
							<div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
								<div className="text-[10px] font-medium text-slate-300 mb-1.5">
									{t("layout.webcamShape")}
								</div>
								<div className="grid grid-cols-4 gap-1.5">
									{(
										[
											{ value: "rectangle", label: "Rect" },
											{ value: "circle", label: "Circle" },
											{ value: "square", label: "Square" },
											{ value: "rounded", label: "Rounded" },
										] as Array<{ value: WebcamMaskShape; label: string }>
									).map((shape) => (
										<button
											key={shape.value}
											type="button"
											onClick={() => onWebcamMaskShapeChange?.(shape.value)}
											className={cn(
												"h-10 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all",
												webcamMaskShape === shape.value
													? "bg-[#34B27B] border-[#34B27B] text-white"
													: "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-400",
											)}
										>
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
												{shape.value === "rectangle" && (
													<rect
														x="1"
														y="3"
														width="14"
														height="10"
														rx="2"
														stroke="currentColor"
														strokeWidth="1.5"
													/>
												)}
												{shape.value === "circle" && (
													<circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
												)}
												{shape.value === "square" && (
													<rect
														x="2"
														y="2"
														width="12"
														height="12"
														rx="1"
														stroke="currentColor"
														strokeWidth="1.5"
													/>
												)}
												{shape.value === "rounded" && (
													<rect
														x="1"
														y="3"
														width="14"
														height="10"
														rx="5"
														stroke="currentColor"
														strokeWidth="1.5"
													/>
												)}
											</svg>
											<span className="text-[8px] leading-none">{shape.label}</span>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Size */}
						{webcamLayoutPreset === "picture-in-picture" && (
							<div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
								<div className="flex items-center justify-between mb-1">
									<div className="text-[10px] font-medium text-slate-300">
										{t("layout.webcamSize")}
									</div>
									<div className="text-[10px] font-medium text-slate-400">{webcamSizePreset}%</div>
								</div>
								<Slider
									value={[webcamSizePreset]}
									onValueChange={(values) => onWebcamSizePresetChange?.(values[0])}
									onValueCommit={() => onWebcamSizePresetCommit?.()}
									min={10}
									max={50}
									step={1}
									className="w-full [&_[role=slider]]:bg-[#34B27B] [&_[role=slider]]:border-[#34B27B] [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
								/>
							</div>
						)}
					</div>
				</div>
			)}

			{!hasWebcam && (
				<div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
					<span className="text-[10px] text-slate-400 leading-relaxed block">
						No webcam video available. Add a webcam recording to configure overlay settings.
					</span>
				</div>
			)}
		</div>
	);
}
