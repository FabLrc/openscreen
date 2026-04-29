import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type {
	AnnotationRegion,
	CropRegion,
	CursorTelemetryPoint,
	SpeedRegion,
	TrimRegion,
	WebcamLayoutPreset,
	WebcamMaskShape,
	WebcamPosition,
	ZoomRegion,
} from "@/components/video-editor/types";
import {
	calculateOutputDimensions,
	type ExportFormat,
	type ExportProgress,
	type ExportQuality,
	type ExportSettings,
	GIF_SIZE_PRESETS,
	GifExporter,
	type GifFrameRate,
	type GifSizePreset,
	VideoExporter,
} from "@/lib/exporter";
import { BackgroundLoadError } from "@/lib/wallpaper";
import {
	type AspectRatio,
	getAspectRatioValue,
	getNativeAspectRatioValue,
} from "@/utils/aspectRatioUtils";

interface ExportDeps {
	isPlaying: boolean;
	videoPath: string | null;
	webcamVideoPath: string | null;
	wallpaper: string;
	zoomRegions: ZoomRegion[];
	trimRegions: TrimRegion[];
	speedRegions: SpeedRegion[];
	shadowIntensity: number;
	showBlur: boolean;
	motionBlurAmount: number;
	borderRadius: number;
	padding: number;
	cropRegion: CropRegion;
	annotationRegions: AnnotationRegion[];
	aspectRatio: AspectRatio;
	webcamLayoutPreset: WebcamLayoutPreset;
	webcamMaskShape: WebcamMaskShape;
	webcamSizePreset: number;
	webcamPosition: WebcamPosition | null;
	cursorTelemetry: CursorTelemetryPoint[];
	t: (key: string, params?: Record<string, string>) => string;
	rawT: (key: string) => string;
	onPlayPause: (shouldPlay: boolean) => void;
}

export function useExport(deps: ExportDeps) {
	const {
		isPlaying,
		videoPath,
		webcamVideoPath,
		wallpaper,
		zoomRegions,
		trimRegions,
		speedRegions,
		shadowIntensity,
		showBlur,
		motionBlurAmount,
		borderRadius,
		padding,
		cropRegion,
		annotationRegions,
		aspectRatio,
		webcamLayoutPreset,
		webcamMaskShape,
		webcamSizePreset,
		webcamPosition,
		cursorTelemetry,
		t,
		rawT,
		onPlayPause,
	} = deps;

	const [exportQuality, setExportQuality] = useState<ExportQuality>("good");
	const [exportFormat, setExportFormat] = useState<ExportFormat>("mp4");
	const [gifFrameRate, setGifFrameRate] = useState<GifFrameRate>(15);
	const [gifLoop, setGifLoop] = useState(true);
	const [gifSizePreset, setGifSizePreset] = useState<GifSizePreset>("medium");
	const [isExporting, setIsExporting] = useState(false);
	const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
	const [exportError, setExportError] = useState<string | null>(null);
	const [showExportDialog, setShowExportDialog] = useState(false);
	const [exportedFilePath, setExportedFilePath] = useState<string | null>(null);

	const exporterRef = useRef<VideoExporter | null>(null);
	const [_unsavedExport, setUnsavedExport] = useState<{
		arrayBuffer: ArrayBuffer;
		fileName: string;
		format: string;
	} | null>(null);

	const handleShowExportedFile = useCallback(async (filePath: string) => {
		try {
			const result = await window.electronAPI.revealInFolder(filePath);
			if (!result.success) {
				const errorMessage = result.error || result.message || "Failed to reveal item in folder.";
				console.error("Failed to reveal in folder:", errorMessage);
				toast.error(errorMessage);
			}
		} catch (error) {
			const errorMessage = String(error);
			console.error("Error calling revealInFolder IPC:", errorMessage);
			toast.error(`Error revealing in folder: ${errorMessage}`);
		}
	}, []);

	const handleExportSaved = useCallback(
		(formatLabel: "GIF" | "Video", filePath: string) => {
			setExportedFilePath(filePath);
			toast.success(
				t("export.exportedSuccessfully", {
					format: formatLabel,
				}),
				{
					description: filePath,
					action: {
						label: rawT("common.actions.showInFolder"),
						onClick: () => {
							void handleShowExportedFile(filePath);
						},
					},
				},
			);
		},
		[handleShowExportedFile, t, rawT],
	);

	const handleExport = useCallback(
		async (
			settings: ExportSettings,
			videoRef?: { currentTime: number; videoWidth: number; videoHeight: number } | null,
		) => {
			if (!videoPath) {
				toast.error("No video loaded");
				return;
			}

			if (!videoRef) {
				toast.error("Video not ready");
				return;
			}

			setIsExporting(true);
			setExportProgress(null);
			setExportError(null);
			setExportedFilePath(null);

			try {
				const wasPlaying = isPlaying;
				if (wasPlaying) {
					onPlayPause(false);
				}

				const sourceWidth = videoRef.videoWidth || 1920;
				const sourceHeight = videoRef.videoHeight || 1080;
				const aspectRatioValue =
					aspectRatio === "native"
						? getNativeAspectRatioValue(sourceWidth, sourceHeight, cropRegion)
						: getAspectRatioValue(aspectRatio);

				if (settings.format === "gif" && settings.gifConfig) {
					const gifExporter = new GifExporter({
						videoUrl: videoPath,
						webcamVideoUrl: webcamVideoPath || undefined,
						width: settings.gifConfig.width,
						height: settings.gifConfig.height,
						frameRate: settings.gifConfig.frameRate,
						loop: settings.gifConfig.loop,
						sizePreset: settings.gifConfig.sizePreset,
						wallpaper,
						zoomRegions,
						trimRegions,
						speedRegions,
						showShadow: shadowIntensity > 0,
						shadowIntensity,
						showBlur,
						motionBlurAmount,
						borderRadius,
						padding,
						videoPadding: padding,
						cropRegion,
						annotationRegions,
						webcamLayoutPreset,
						webcamMaskShape,
						webcamSizePreset,
						webcamPosition,
						previewWidth: 1920,
						previewHeight: 1080,
						cursorTelemetry,
						onProgress: (progress: ExportProgress) => {
							setExportProgress(progress);
						},
					});

					exporterRef.current = gifExporter as unknown as VideoExporter;
					const result = await gifExporter.export();

					if (result.success && result.blob) {
						const arrayBuffer = await result.blob.arrayBuffer();
						const timestamp = Date.now();
						const fileName = `export-${timestamp}.gif`;

						const saveResult = await window.electronAPI.saveExportedVideo(arrayBuffer, fileName);

						if (saveResult.canceled) {
							setUnsavedExport({ arrayBuffer, fileName, format: "gif" });
							toast.info("Export canceled");
						} else if (saveResult.success && saveResult.path) {
							setUnsavedExport(null);
							handleExportSaved("GIF", saveResult.path);
						} else {
							setExportError(saveResult.message || "Failed to save GIF");
							toast.error(saveResult.message || "Failed to save GIF");
						}
					} else {
						setExportError(result.error || "GIF export failed");
						toast.error(result.error || "GIF export failed");
					}
				} else {
					const quality = settings.quality || exportQuality;
					let exportWidth: number;
					let exportHeight: number;
					let bitrate: number;

					if (quality === "source") {
						exportWidth = sourceWidth;
						exportHeight = sourceHeight;

						if (aspectRatioValue === 1) {
							const baseDimension = Math.floor(Math.min(sourceWidth, sourceHeight) / 2) * 2;
							exportWidth = baseDimension;
							exportHeight = baseDimension;
						} else if (aspectRatioValue > 1) {
							const baseWidth = Math.floor(sourceWidth / 2) * 2;
							let found = false;
							for (let w = baseWidth; w >= 100 && !found; w -= 2) {
								const h = Math.round(w / aspectRatioValue);
								if (h % 2 === 0 && Math.abs(w / h - aspectRatioValue) < 0.0001) {
									exportWidth = w;
									exportHeight = h;
									found = true;
								}
							}
							if (!found) {
								exportWidth = baseWidth;
								exportHeight = Math.floor(baseWidth / aspectRatioValue / 2) * 2;
							}
						} else {
							const baseHeight = Math.floor(sourceHeight / 2) * 2;
							let found = false;
							for (let h = baseHeight; h >= 100 && !found; h -= 2) {
								const w = Math.round(h * aspectRatioValue);
								if (w % 2 === 0 && Math.abs(w / h - aspectRatioValue) < 0.0001) {
									exportWidth = w;
									exportHeight = h;
									found = true;
								}
							}
							if (!found) {
								exportHeight = baseHeight;
								exportWidth = Math.floor((baseHeight * aspectRatioValue) / 2) * 2;
							}
						}

						const totalPixels = exportWidth * exportHeight;
						bitrate = 30_000_000;
						if (totalPixels > 1920 * 1080 && totalPixels <= 2560 * 1440) {
							bitrate = 50_000_000;
						} else if (totalPixels > 2560 * 1440) {
							bitrate = 80_000_000;
						}
					} else {
						const targetHeight = quality === "medium" ? 720 : 1080;
						exportHeight = Math.floor(targetHeight / 2) * 2;
						exportWidth = Math.floor((exportHeight * aspectRatioValue) / 2) * 2;

						const totalPixels = exportWidth * exportHeight;
						if (totalPixels <= 1280 * 720) {
							bitrate = 10_000_000;
						} else if (totalPixels <= 1920 * 1080) {
							bitrate = 20_000_000;
						} else {
							bitrate = 30_000_000;
						}
					}

					const exporter = new VideoExporter({
						videoUrl: videoPath,
						webcamVideoUrl: webcamVideoPath || undefined,
						width: exportWidth,
						height: exportHeight,
						frameRate: 60,
						bitrate,
						codec: "avc1.640033",
						wallpaper,
						zoomRegions,
						trimRegions,
						speedRegions,
						showShadow: shadowIntensity > 0,
						shadowIntensity,
						showBlur,
						motionBlurAmount,
						borderRadius,
						padding,
						cropRegion,
						annotationRegions,
						webcamLayoutPreset,
						webcamMaskShape,
						webcamSizePreset,
						webcamPosition,
						previewWidth: 1920,
						previewHeight: 1080,
						cursorTelemetry,
						onProgress: (progress: ExportProgress) => {
							setExportProgress(progress);
						},
					});

					exporterRef.current = exporter;
					const result = await exporter.export();

					if (result.success && result.blob) {
						const arrayBuffer = await result.blob.arrayBuffer();
						const timestamp = Date.now();
						const fileName = `export-${timestamp}.mp4`;

						const saveResult = await window.electronAPI.saveExportedVideo(arrayBuffer, fileName);

						if (saveResult.canceled) {
							setUnsavedExport({ arrayBuffer, fileName, format: "mp4" });
							toast.info("Export canceled");
						} else if (saveResult.success && saveResult.path) {
							setUnsavedExport(null);
							handleExportSaved("Video", saveResult.path);
						} else {
							setExportError(saveResult.message || "Failed to save video");
							toast.error(saveResult.message || "Failed to save video");
						}
					} else {
						setExportError(result.error || "Export failed");
						toast.error(result.error || "Export failed");
					}
				}

				if (wasPlaying) {
					onPlayPause(true);
				}
			} catch (error) {
				console.error("Export error:", error);
				if (error instanceof BackgroundLoadError) {
					const message = t("errors.exportBackgroundLoadFailed", { url: error.displayUrl });
					setExportError(message);
					toast.error(message);
				} else {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					setExportError(errorMessage);
					toast.error(t("errors.exportFailedWithError", { error: errorMessage }));
				}
			} finally {
				setIsExporting(false);
				exporterRef.current = null;
				setShowExportDialog(false);
				setExportProgress(null);
			}
		},
		[
			videoPath,
			webcamVideoPath,
			wallpaper,
			zoomRegions,
			trimRegions,
			speedRegions,
			shadowIntensity,
			showBlur,
			motionBlurAmount,
			borderRadius,
			padding,
			cropRegion,
			annotationRegions,
			isPlaying,
			aspectRatio,
			webcamLayoutPreset,
			webcamMaskShape,
			webcamSizePreset,
			webcamPosition,
			exportQuality,
			handleExportSaved,
			cursorTelemetry,
			t,
			onPlayPause,
		],
	);

	const handleOpenExportDialog = useCallback(
		(videoRef?: { currentTime: number; videoWidth: number; videoHeight: number } | null) => {
			if (!videoPath) {
				toast.error("No video loaded");
				return;
			}

			if (!videoRef) {
				toast.error("Video not ready");
				return;
			}

			const sourceWidth = videoRef.videoWidth || 1920;
			const sourceHeight = videoRef.videoHeight || 1080;
			const aspectRatioValue =
				aspectRatio === "native"
					? getNativeAspectRatioValue(sourceWidth, sourceHeight, cropRegion)
					: getAspectRatioValue(aspectRatio);
			const gifDimensions = calculateOutputDimensions(
				sourceWidth,
				sourceHeight,
				gifSizePreset,
				GIF_SIZE_PRESETS,
				aspectRatioValue,
			);

			const settings: ExportSettings = {
				format: exportFormat,
				quality: exportFormat === "mp4" ? exportQuality : undefined,
				gifConfig:
					exportFormat === "gif"
						? {
								frameRate: gifFrameRate,
								loop: gifLoop,
								sizePreset: gifSizePreset,
								width: gifDimensions.width,
								height: gifDimensions.height,
							}
						: undefined,
			};

			setShowExportDialog(true);
			setExportError(null);
			setExportedFilePath(null);

			handleExport(settings, videoRef);
		},
		[
			videoPath,
			exportFormat,
			exportQuality,
			gifFrameRate,
			gifLoop,
			gifSizePreset,
			aspectRatio,
			cropRegion,
			handleExport,
		],
	);

	const handleCancelExport = useCallback(() => {
		if (exporterRef.current) {
			exporterRef.current.cancel();
			toast.info("Export canceled");
			setShowExportDialog(false);
			setIsExporting(false);
			setExportProgress(null);
			setExportError(null);
			setExportedFilePath(null);
		}
	}, []);

	return {
		exportState: {
			exportQuality,
			exportFormat,
			gifFrameRate,
			gifLoop,
			gifSizePreset,
			isExporting,
			exportProgress,
			exportError,
			showExportDialog,
			exportedFilePath,
		},
		setExportQuality,
		setExportFormat,
		setGifFrameRate,
		setGifLoop,
		setGifSizePreset,
		setShowExportDialog,
		handleExport,
		handleOpenExportDialog,
		handleCancelExport,
		handleShowExportedFile,
	};
}
