import type { Span } from "dnd-timeline";
import {
	Download,
	FolderOpen,
	Image,
	Keyboard,
	Layers,
	Maximize,
	Music,
	PenLine,
	Redo2,
	Save,
	Scissors,
	Sparkles,
	Type,
	Undo2,
	Video,
	Volume2,
	WandSparkles,
	Zap,
	ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useI18n, useScopedT } from "@/contexts/I18nContext";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import { INITIAL_EDITOR_STATE, useEditorHistory } from "@/hooks/useEditorHistory";
import { useExport } from "@/hooks/useExport";
import { computeFrameStepTime } from "@/lib/frameStep";
import type { ProjectMedia } from "@/lib/recordingSession";
import { matchesShortcut } from "@/lib/shortcuts";
import { loadUserPreferences, saveUserPreferences } from "@/lib/userPreferences";
import {
	getAspectRatioValue,
	getNativeAspectRatioValue,
	isPortraitAspectRatio,
} from "@/utils/aspectRatioUtils";
import CommandPalette from "./CommandPalette";
import { ExportDialog } from "./ExportDialog";
import PlaybackBar from "./PlaybackBar";
import PanelAnnotations from "./panels/PanelAnnotations";
import PanelAudio from "./panels/PanelAudio";
import PanelBackground from "./panels/PanelBackground";
import PanelEdit from "./panels/PanelEdit";
import PanelOverlay from "./panels/PanelOverlay";
import PanelVisual from "./panels/PanelVisual";
import {
	createProjectData,
	createProjectSnapshot,
	deriveNextId,
	fromFileUrl,
	hasProjectUnsavedChanges,
	normalizeProjectEditor,
	resolveProjectMedia,
	toFileUrl,
	validateProjectData,
} from "./projectPersistence";
import SidePanel from "./SidePanel";
import TabRail from "./TabRail";
import Titlebar from "./Titlebar";
import TimelineEditor from "./timeline/TimelineEditor";
import {
	detectZoomDwellCandidates,
	normalizeCursorTelemetry,
} from "./timeline/zoomSuggestionUtils";
import {
	type AnnotationRegion,
	type BlurData,
	type CursorTelemetryPoint,
	clampFocusToDepth,
	DEFAULT_ANNOTATION_POSITION,
	DEFAULT_ANNOTATION_SIZE,
	DEFAULT_ANNOTATION_STYLE,
	DEFAULT_BLUR_DATA,
	DEFAULT_FIGURE_DATA,
	DEFAULT_PLAYBACK_SPEED,
	DEFAULT_ZOOM_DEPTH,
	type FigureData,
	type PlaybackSpeed,
	type SpeedRegion,
	type TrimRegion,
	type ZoomDepth,
	type ZoomFocus,
	type ZoomFocusMode,
	type ZoomRegion,
} from "./types";
import VideoPlayback, { VideoPlaybackRef } from "./VideoPlayback";

export default function VideoEditor() {
	const {
		state: editorState,
		pushState,
		updateState,
		commitState,
		undo,
		redo,
		undoCount,
		redoCount,
	} = useEditorHistory(INITIAL_EDITOR_STATE);

	const {
		zoomRegions,
		trimRegions,
		speedRegions,
		annotationRegions,
		cropRegion,
		wallpaper,
		shadowIntensity,
		showBlur,
		motionBlurAmount,
		borderRadius,
		padding,
		aspectRatio,
		webcamLayoutPreset,
		webcamMaskShape,
		webcamSizePreset,
		webcamPosition,
	} = editorState;

	// ── Non-undoable state
	const [videoPath, setVideoPath] = useState<string | null>(null);
	const [videoSourcePath, setVideoSourcePath] = useState<string | null>(null);
	const [webcamVideoPath, setWebcamVideoPath] = useState<string | null>(null);
	const [webcamVideoSourcePath, setWebcamVideoSourcePath] = useState<string | null>(null);
	const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const currentTimeRef = useRef(currentTime);
	currentTimeRef.current = currentTime;
	const durationRef = useRef(duration);
	durationRef.current = duration;
	const [cursorTelemetry, setCursorTelemetry] = useState<CursorTelemetryPoint[]>([]);
	const [selectedZoomId, setSelectedZoomId] = useState<string | null>(null);
	const [selectedTrimId, setSelectedTrimId] = useState<string | null>(null);
	const [selectedSpeedId, setSelectedSpeedId] = useState<string | null>(null);
	const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
	const [selectedBlurId, setSelectedBlurId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string | null>(null);
	const [sidePanelWidth, setSidePanelWidth] = useState(244);
	const [showNewRecordingDialog, setShowNewRecordingDialog] = useState(false);
	const [showCommandPalette, setShowCommandPalette] = useState(false);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const playerContainerRef = useRef<HTMLDivElement>(null);
	const videoPlaybackRef = useRef<VideoPlaybackRef>(null);

	const nextZoomIdRef = useRef(1);
	const nextTrimIdRef = useRef(1);
	const nextSpeedIdRef = useRef(1);

	const { shortcuts, isMac, openConfig } = useShortcuts();
	const { locale, setLocale, t: rawT } = useI18n();
	const t = useScopedT("editor");
	const ts = useScopedT("settings");
	const tTimeline = useScopedT("timeline");
	const tp = useScopedT("commandPalette");

	const nextAnnotationIdRef = useRef(1);
	const nextAnnotationZIndexRef = useRef(1);

	const exportApi = useExport({
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
		onPlayPause: (shouldPlay) => {
			if (shouldPlay) {
				videoPlaybackRef.current?.play().catch(console.error);
			} else {
				videoPlaybackRef.current?.pause();
			}
		},
	});

	const {
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
	} = exportApi.exportState;

	const annotationOnlyRegions = useMemo(
		() => annotationRegions.filter((region) => region.type !== "blur"),
		[annotationRegions],
	);
	const blurRegions = useMemo(
		() => annotationRegions.filter((region) => region.type === "blur"),
		[annotationRegions],
	);

	const totalMs = useMemo(() => Math.max(0, Math.round(duration * 1000)), [duration]);
	const currentTimeMs = useMemo(() => Math.round(currentTime * 1000), [currentTime]);
	const defaultRegionDurationMs = useMemo(
		() => Math.max(1000, Math.round(totalMs * 0.05)),
		[totalMs],
	);

	const currentProjectMedia = useMemo<ProjectMedia | null>(() => {
		const screenVideoPath = videoSourcePath ?? (videoPath ? fromFileUrl(videoPath) : null);
		if (!screenVideoPath) {
			return null;
		}

		const webcamSourcePath =
			webcamVideoSourcePath ?? (webcamVideoPath ? fromFileUrl(webcamVideoPath) : null);
		return webcamSourcePath
			? { screenVideoPath, webcamVideoPath: webcamSourcePath }
			: { screenVideoPath };
	}, [videoPath, videoSourcePath, webcamVideoPath, webcamVideoSourcePath]);

	const applyLoadedProject = useCallback(
		async (candidate: unknown, path?: string | null) => {
			if (!validateProjectData(candidate)) {
				return false;
			}

			const project = candidate;
			const media = resolveProjectMedia(project);
			if (!media) {
				return false;
			}
			const sourcePath = fromFileUrl(media.screenVideoPath);
			const webcamSourcePath = media.webcamVideoPath ? fromFileUrl(media.webcamVideoPath) : null;
			const normalizedEditor = normalizeProjectEditor(project.editor);

			try {
				videoPlaybackRef.current?.pause();
			} catch {
				// no-op
			}
			setIsPlaying(false);
			setCurrentTime(0);
			setDuration(0);

			setError(null);
			setVideoSourcePath(sourcePath);
			setVideoPath(toFileUrl(sourcePath));
			setWebcamVideoSourcePath(webcamSourcePath);
			setWebcamVideoPath(webcamSourcePath ? toFileUrl(webcamSourcePath) : null);
			setCurrentProjectPath(path ?? null);

			pushState({
				wallpaper: normalizedEditor.wallpaper,
				shadowIntensity: normalizedEditor.shadowIntensity,
				showBlur: normalizedEditor.showBlur,
				motionBlurAmount: normalizedEditor.motionBlurAmount,
				borderRadius: normalizedEditor.borderRadius,
				padding: normalizedEditor.padding,
				cropRegion: normalizedEditor.cropRegion,
				zoomRegions: normalizedEditor.zoomRegions,
				trimRegions: normalizedEditor.trimRegions,
				speedRegions: normalizedEditor.speedRegions,
				annotationRegions: normalizedEditor.annotationRegions,
				aspectRatio: normalizedEditor.aspectRatio,
				webcamLayoutPreset: normalizedEditor.webcamLayoutPreset,
				webcamMaskShape: normalizedEditor.webcamMaskShape,
				webcamSizePreset: normalizedEditor.webcamSizePreset,
				webcamPosition: normalizedEditor.webcamPosition,
			});
			exportApi.setExportQuality(normalizedEditor.exportQuality);
			exportApi.setExportFormat(normalizedEditor.exportFormat);
			exportApi.setGifFrameRate(normalizedEditor.gifFrameRate);
			exportApi.setGifLoop(normalizedEditor.gifLoop);
			exportApi.setGifSizePreset(normalizedEditor.gifSizePreset);

			setSelectedZoomId(null);
			setSelectedTrimId(null);
			setSelectedSpeedId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);

			nextZoomIdRef.current = deriveNextId(
				"zoom",
				normalizedEditor.zoomRegions.map((region) => region.id),
			);
			nextTrimIdRef.current = deriveNextId(
				"trim",
				normalizedEditor.trimRegions.map((region) => region.id),
			);
			nextSpeedIdRef.current = deriveNextId(
				"speed",
				normalizedEditor.speedRegions.map((region) => region.id),
			);
			nextAnnotationIdRef.current = deriveNextId(
				"annotation",
				normalizedEditor.annotationRegions.map((region) => region.id),
			);
			nextAnnotationZIndexRef.current =
				normalizedEditor.annotationRegions.reduce(
					(max, region) => Math.max(max, region.zIndex),
					0,
				) + 1;

			setLastSavedSnapshot(
				createProjectSnapshot(
					webcamSourcePath
						? { screenVideoPath: sourcePath, webcamVideoPath: webcamSourcePath }
						: { screenVideoPath: sourcePath },
					normalizedEditor,
				),
			);
			return true;
		},
		[pushState],
	);

	const currentProjectSnapshot = useMemo(() => {
		if (!currentProjectMedia) {
			return null;
		}
		return createProjectSnapshot(currentProjectMedia, {
			wallpaper,
			shadowIntensity,
			showBlur,
			motionBlurAmount,
			borderRadius,
			padding,
			cropRegion,
			zoomRegions,
			trimRegions,
			speedRegions,
			annotationRegions,
			aspectRatio,
			webcamLayoutPreset,
			webcamMaskShape,
			webcamPosition,
			exportQuality,
			exportFormat,
			gifFrameRate,
			gifLoop,
			gifSizePreset,
		});
	}, [
		currentProjectMedia,
		wallpaper,
		shadowIntensity,
		showBlur,
		motionBlurAmount,
		borderRadius,
		padding,
		cropRegion,
		zoomRegions,
		trimRegions,
		speedRegions,
		annotationRegions,
		aspectRatio,
		webcamLayoutPreset,
		webcamMaskShape,
		webcamPosition,
		exportQuality,
		exportFormat,
		gifFrameRate,
		gifLoop,
		gifSizePreset,
	]);

	const hasUnsavedChanges = hasProjectUnsavedChanges(currentProjectSnapshot, lastSavedSnapshot);

	useEffect(() => {
		async function loadInitialData() {
			try {
				const currentProjectResult = await window.electronAPI.loadCurrentProjectFile();
				if (currentProjectResult.success && currentProjectResult.project) {
					const restored = await applyLoadedProject(
						currentProjectResult.project,
						currentProjectResult.path ?? null,
					);
					if (restored) {
						return;
					}
				}

				const currentSessionResult = await window.electronAPI.getCurrentRecordingSession();
				if (currentSessionResult.success && currentSessionResult.session) {
					const session = currentSessionResult.session;
					const sourcePath = fromFileUrl(session.screenVideoPath);
					const webcamSourcePath = session.webcamVideoPath
						? fromFileUrl(session.webcamVideoPath)
						: null;
					setVideoSourcePath(sourcePath);
					setVideoPath(toFileUrl(sourcePath));
					setWebcamVideoSourcePath(webcamSourcePath);
					setWebcamVideoPath(webcamSourcePath ? toFileUrl(webcamSourcePath) : null);
					setCurrentProjectPath(null);
					setLastSavedSnapshot(
						createProjectSnapshot(
							webcamSourcePath
								? {
										screenVideoPath: sourcePath,
										webcamVideoPath: webcamSourcePath,
									}
								: { screenVideoPath: sourcePath },
							INITIAL_EDITOR_STATE,
						),
					);
					return;
				}

				const result = await window.electronAPI.getCurrentVideoPath();
				if (result.success && result.path) {
					const sourcePath = fromFileUrl(result.path);
					setVideoSourcePath(sourcePath);
					setVideoPath(toFileUrl(sourcePath));
					setWebcamVideoSourcePath(null);
					setWebcamVideoPath(null);
					setCurrentProjectPath(null);
					setLastSavedSnapshot(
						createProjectSnapshot({ screenVideoPath: sourcePath }, INITIAL_EDITOR_STATE),
					);
				} else {
					setError("No video to load. Please record or select a video.");
				}
			} catch (err) {
				setError("Error loading video: " + String(err));
			} finally {
				setLoading(false);
			}
		}

		loadInitialData();
	}, [applyLoadedProject]);

	// Track whether user preferences have been loaded to avoid
	// overwriting saved prefs with defaults on the first render
	const [prefsHydrated, setPrefsHydrated] = useState(false);

	// Load persisted user preferences on mount (intentionally runs once)
	useEffect(() => {
		const prefs = loadUserPreferences();
		updateState({
			padding: prefs.padding,
			aspectRatio: prefs.aspectRatio,
		});
		exportApi.setExportQuality(prefs.exportQuality);
		exportApi.setExportFormat(prefs.exportFormat);
		setPrefsHydrated(true);
	}, [updateState]);

	// Auto-save user preferences when settings change
	useEffect(() => {
		if (!prefsHydrated) return;
		saveUserPreferences({
			padding,
			aspectRatio,
			exportQuality: exportQuality,
			exportFormat: exportFormat,
		});
	}, [prefsHydrated, padding, aspectRatio, exportQuality, exportFormat]);

	const saveProject = useCallback(
		async (forceSaveAs: boolean) => {
			if (!videoPath) {
				toast.error(t("errors.noVideoLoaded"));
				return false;
			}

			if (!currentProjectMedia) {
				toast.error(t("errors.unableToDetermineSourcePath"));
				return false;
			}

			const projectData = createProjectData(currentProjectMedia, {
				wallpaper,
				shadowIntensity,
				showBlur,
				motionBlurAmount,
				borderRadius,
				padding,
				cropRegion,
				zoomRegions,
				trimRegions,
				speedRegions,
				annotationRegions,
				aspectRatio,
				webcamLayoutPreset,
				webcamMaskShape,
				webcamSizePreset,
				webcamPosition,
				exportQuality,
				exportFormat,
				gifFrameRate,
				gifLoop,
				gifSizePreset,
			});

			const fileNameBase =
				currentProjectMedia.screenVideoPath
					.split(/[\\/]/)
					.pop()
					?.replace(/\.[^.]+$/, "") || `project-${Date.now()}`;
			const projectSnapshot = JSON.stringify(projectData);
			const result = await window.electronAPI.saveProjectFile(
				projectData,
				fileNameBase,
				forceSaveAs ? undefined : (currentProjectPath ?? undefined),
			);

			if (result.canceled) {
				toast.info(t("project.saveCanceled"));
				return false;
			}

			if (!result.success) {
				toast.error(result.message || t("project.failedToSave"));
				return false;
			}

			if (result.path) {
				setCurrentProjectPath(result.path);
			}
			setLastSavedSnapshot(projectSnapshot);

			toast.success(t("project.savedTo", { path: result.path ?? "" }));
			return true;
		},
		[
			currentProjectMedia,
			currentProjectPath,
			wallpaper,
			shadowIntensity,
			showBlur,
			motionBlurAmount,
			borderRadius,
			padding,
			cropRegion,
			zoomRegions,
			trimRegions,
			speedRegions,
			annotationRegions,
			aspectRatio,
			webcamLayoutPreset,
			webcamMaskShape,
			webcamPosition,
			exportQuality,
			exportFormat,
			gifFrameRate,
			gifLoop,
			gifSizePreset,
			videoPath,
			t,
			webcamSizePreset,
		],
	);

	useEffect(() => {
		window.electronAPI.setHasUnsavedChanges(hasUnsavedChanges);
	}, [hasUnsavedChanges]);

	useEffect(() => {
		const cleanup = window.electronAPI.onRequestSaveBeforeClose(async () => {
			return saveProject(false);
		});
		return () => cleanup();
	}, [saveProject]);

	const handleSaveProject = useCallback(async () => {
		await saveProject(false);
	}, [saveProject]);

	const handleSaveProjectAs = useCallback(async () => {
		await saveProject(true);
	}, [saveProject]);

	const handleNewRecordingConfirm = useCallback(async () => {
		const result = await window.electronAPI.startNewRecording();
		if (result.success) {
			setShowNewRecordingDialog(false);
		} else {
			console.error("Failed to start new recording:", result.error);
			setError("Failed to start new recording: " + (result.error || "Unknown error"));
		}
	}, []);

	const handleLoadProject = useCallback(async () => {
		const result = await window.electronAPI.loadProjectFile();

		if (result.canceled) {
			return;
		}

		if (!result.success) {
			toast.error(result.message || t("project.failedToLoad"));
			return;
		}

		const restored = await applyLoadedProject(result.project, result.path ?? null);
		if (!restored) {
			toast.error(t("project.invalidFormat"));
			return;
		}

		toast.success(t("project.loadedFrom", { path: result.path ?? "" }));
	}, [applyLoadedProject, t]);

	useEffect(() => {
		const removeLoadListener = window.electronAPI.onMenuLoadProject(handleLoadProject);
		const removeSaveListener = window.electronAPI.onMenuSaveProject(handleSaveProject);
		const removeSaveAsListener = window.electronAPI.onMenuSaveProjectAs(handleSaveProjectAs);

		return () => {
			removeLoadListener?.();
			removeSaveListener?.();
			removeSaveAsListener?.();
		};
	}, [handleLoadProject, handleSaveProject, handleSaveProjectAs]);

	useEffect(() => {
		let mounted = true;

		async function loadCursorTelemetry() {
			const sourcePath = currentProjectMedia?.screenVideoPath ?? null;

			if (!sourcePath) {
				if (mounted) {
					setCursorTelemetry([]);
				}
				return;
			}

			try {
				const result = await window.electronAPI.getCursorTelemetry(sourcePath);
				if (mounted) {
					setCursorTelemetry(result.success ? result.samples : []);
				}
			} catch (telemetryError) {
				console.warn("Unable to load cursor telemetry:", telemetryError);
				if (mounted) {
					setCursorTelemetry([]);
				}
			}
		}

		loadCursorTelemetry();

		return () => {
			mounted = false;
		};
	}, [currentProjectMedia]);

	function togglePlayPause() {
		const playback = videoPlaybackRef.current;
		const video = playback?.video;
		if (!playback || !video) return;

		if (isPlaying) {
			playback.pause();
		} else {
			playback.play().catch((err) => console.error("Video play failed:", err));
		}
	}

	const toggleFullscreen = useCallback(() => {
		setIsFullscreen((prev) => !prev);
	}, []);

	useEffect(() => {
		if (!isFullscreen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsFullscreen(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isFullscreen]);

	function handleSeek(time: number) {
		const video = videoPlaybackRef.current?.video;
		if (!video) return;
		video.currentTime = time;
	}

	const handleSelectZoom = useCallback((id: string | null) => {
		setSelectedZoomId(id);
		if (id) {
			setSelectedTrimId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);
			setActiveTab("visual");
		}
	}, []);

	const handleSelectTrim = useCallback((id: string | null) => {
		setSelectedTrimId(id);
		if (id) {
			setSelectedZoomId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);
			setActiveTab("edit");
		}
	}, []);

	const handleSelectAnnotation = useCallback((id: string | null) => {
		setSelectedAnnotationId(id);
		if (id) {
			setSelectedZoomId(null);
			setSelectedTrimId(null);
			setSelectedBlurId(null);
			setActiveTab("annotations");
		}
	}, []);

	const handleSelectBlur = useCallback((id: string | null) => {
		setSelectedBlurId(id);
		if (id) {
			setSelectedZoomId(null);
			setSelectedTrimId(null);
			setSelectedAnnotationId(null);
			setSelectedSpeedId(null);
			setActiveTab("annotations");
		}
	}, []);

	const handleZoomAdded = useCallback(
		(span: Span) => {
			const id = `zoom-${nextZoomIdRef.current++}`;
			const newRegion: ZoomRegion = {
				id,
				startMs: Math.round(span.start),
				endMs: Math.round(span.end),
				depth: DEFAULT_ZOOM_DEPTH,
				focus: { cx: 0.5, cy: 0.5 },
			};
			pushState((prev) => ({ zoomRegions: [...prev.zoomRegions, newRegion] }));
			setSelectedZoomId(id);
			setSelectedTrimId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);
		},
		[pushState],
	);

	const handleZoomSuggested = useCallback(
		(span: Span, focus: ZoomFocus) => {
			const id = `zoom-${nextZoomIdRef.current++}`;
			const newRegion: ZoomRegion = {
				id,
				startMs: Math.round(span.start),
				endMs: Math.round(span.end),
				depth: DEFAULT_ZOOM_DEPTH,
				focus: clampFocusToDepth(focus, DEFAULT_ZOOM_DEPTH),
			};
			pushState((prev) => ({ zoomRegions: [...prev.zoomRegions, newRegion] }));
			setSelectedZoomId(id);
			setSelectedTrimId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);
		},
		[pushState],
	);

	const handleTrimAdded = useCallback(
		(span: Span) => {
			const id = `trim-${nextTrimIdRef.current++}`;
			const newRegion: TrimRegion = {
				id,
				startMs: Math.round(span.start),
				endMs: Math.round(span.end),
			};
			pushState((prev) => ({ trimRegions: [...prev.trimRegions, newRegion] }));
			setSelectedTrimId(id);
			setSelectedZoomId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);
		},
		[pushState],
	);

	const handleZoomSpanChange = useCallback(
		(id: string, span: Span) => {
			pushState((prev) => ({
				zoomRegions: prev.zoomRegions.map((region) =>
					region.id === id
						? {
								...region,
								startMs: Math.round(span.start),
								endMs: Math.round(span.end),
							}
						: region,
				),
			}));
		},
		[pushState],
	);

	const handleTrimSpanChange = useCallback(
		(id: string, span: Span) => {
			pushState((prev) => ({
				trimRegions: prev.trimRegions.map((region) =>
					region.id === id
						? {
								...region,
								startMs: Math.round(span.start),
								endMs: Math.round(span.end),
							}
						: region,
				),
			}));
		},
		[pushState],
	);

	// Focus drag: updateState for live preview, commitState on pointer-up
	const handleZoomFocusChange = useCallback(
		(id: string, focus: ZoomFocus) => {
			updateState((prev) => ({
				zoomRegions: prev.zoomRegions.map((region) =>
					region.id === id ? { ...region, focus: clampFocusToDepth(focus, region.depth) } : region,
				),
			}));
		},
		[updateState],
	);

	const handleZoomDepthChange = useCallback(
		(depth: ZoomDepth) => {
			if (!selectedZoomId) return;
			pushState((prev) => ({
				zoomRegions: prev.zoomRegions.map((region) =>
					region.id === selectedZoomId
						? {
								...region,
								depth,
								focus: clampFocusToDepth(region.focus, depth),
							}
						: region,
				),
			}));
		},
		[selectedZoomId, pushState],
	);

	const handleZoomFocusModeChange = useCallback(
		(focusMode: ZoomFocusMode) => {
			if (!selectedZoomId) return;
			pushState((prev) => ({
				zoomRegions: prev.zoomRegions.map((region) =>
					region.id === selectedZoomId ? { ...region, focusMode } : region,
				),
			}));
		},
		[selectedZoomId, pushState],
	);

	const handleZoomDelete = useCallback(
		(id: string) => {
			pushState((prev) => ({
				zoomRegions: prev.zoomRegions.filter((r) => r.id !== id),
			}));
			if (selectedZoomId === id) {
				setSelectedZoomId(null);
			}
		},
		[selectedZoomId, pushState],
	);

	const handleTrimDelete = useCallback(
		(id: string) => {
			pushState((prev) => ({
				trimRegions: prev.trimRegions.filter((r) => r.id !== id),
			}));
			if (selectedTrimId === id) {
				setSelectedTrimId(null);
			}
		},
		[selectedTrimId, pushState],
	);

	const handleSelectSpeed = useCallback((id: string | null) => {
		setSelectedSpeedId(id);
		if (id) {
			setSelectedZoomId(null);
			setSelectedTrimId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);
			setActiveTab("visual");
		}
	}, []);

	const handleSpeedAdded = useCallback(
		(span: Span) => {
			const id = `speed-${nextSpeedIdRef.current++}`;
			const newRegion: SpeedRegion = {
				id,
				startMs: Math.round(span.start),
				endMs: Math.round(span.end),
				speed: DEFAULT_PLAYBACK_SPEED,
			};
			pushState((prev) => ({
				speedRegions: [...prev.speedRegions, newRegion],
			}));
			setSelectedSpeedId(id);
			setSelectedZoomId(null);
			setSelectedTrimId(null);
			setSelectedAnnotationId(null);
			setSelectedBlurId(null);
		},
		[pushState],
	);

	const handleSpeedSpanChange = useCallback(
		(id: string, span: Span) => {
			pushState((prev) => ({
				speedRegions: prev.speedRegions.map((region) =>
					region.id === id
						? {
								...region,
								startMs: Math.round(span.start),
								endMs: Math.round(span.end),
							}
						: region,
				),
			}));
		},
		[pushState],
	);

	const handleSpeedDelete = useCallback(
		(id: string) => {
			pushState((prev) => ({
				speedRegions: prev.speedRegions.filter((region) => region.id !== id),
			}));
			if (selectedSpeedId === id) {
				setSelectedSpeedId(null);
			}
		},
		[selectedSpeedId, pushState],
	);

	const handleSpeedChange = useCallback(
		(speed: PlaybackSpeed) => {
			if (!selectedSpeedId) return;
			pushState((prev) => ({
				speedRegions: prev.speedRegions.map((region) =>
					region.id === selectedSpeedId ? { ...region, speed } : region,
				),
			}));
		},
		[selectedSpeedId, pushState],
	);

	const handleAnnotationAdded = useCallback(
		(span: Span) => {
			const id = `annotation-${nextAnnotationIdRef.current++}`;
			const zIndex = nextAnnotationZIndexRef.current++;
			const newRegion: AnnotationRegion = {
				id,
				startMs: Math.round(span.start),
				endMs: Math.round(span.end),
				type: "text",
				content: "Enter text...",
				position: { ...DEFAULT_ANNOTATION_POSITION },
				size: { ...DEFAULT_ANNOTATION_SIZE },
				style: { ...DEFAULT_ANNOTATION_STYLE },
				zIndex,
			};
			pushState((prev) => ({
				annotationRegions: [...prev.annotationRegions, newRegion],
			}));
			setSelectedAnnotationId(id);
			setSelectedZoomId(null);
			setSelectedTrimId(null);
			setSelectedBlurId(null);
		},
		[pushState],
	);

	const handleBlurAdded = useCallback(
		(span: Span) => {
			const id = `annotation-${nextAnnotationIdRef.current++}`;
			const zIndex = nextAnnotationZIndexRef.current++;
			const newRegion: AnnotationRegion = {
				id,
				startMs: Math.round(span.start),
				endMs: Math.round(span.end),
				type: "blur",
				content: "",
				position: { ...DEFAULT_ANNOTATION_POSITION },
				size: { ...DEFAULT_ANNOTATION_SIZE },
				style: { ...DEFAULT_ANNOTATION_STYLE },
				zIndex,
				blurData: { ...DEFAULT_BLUR_DATA },
			};
			pushState((prev) => ({
				annotationRegions: [...prev.annotationRegions, newRegion],
			}));
			setSelectedBlurId(id);
			setSelectedAnnotationId(null);
			setSelectedZoomId(null);
			setSelectedTrimId(null);
			setSelectedSpeedId(null);
		},
		[pushState],
	);

	const handleAddZoomFromBar = useCallback(() => {
		if (!duration || duration === 0 || totalMs === 0) return;
		const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
		if (defaultDuration <= 0) return;
		const startPos = Math.max(0, Math.min(currentTimeMs, totalMs));
		const sorted = [...zoomRegions].sort((a, b) => a.startMs - b.startMs);
		const nextRegion = sorted.find((region) => region.startMs > startPos);
		const gapToNext = nextRegion ? nextRegion.startMs - startPos : totalMs - startPos;
		const isOverlapping = sorted.some(
			(region) => startPos >= region.startMs && startPos < region.endMs,
		);
		if (isOverlapping || gapToNext <= 0) {
			toast.error(tTimeline("errors.cannotPlaceZoom"), {
				description: tTimeline("errors.zoomExistsAtLocation"),
			});
			return;
		}
		const actualDuration = Math.min(defaultRegionDurationMs, gapToNext);
		handleZoomAdded({ start: startPos, end: startPos + actualDuration });
	}, [
		duration,
		totalMs,
		currentTimeMs,
		zoomRegions,
		defaultRegionDurationMs,
		tTimeline,
		handleZoomAdded,
	]);

	const handleAddTrimFromBar = useCallback(() => {
		if (!duration || duration === 0 || totalMs === 0) return;
		const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
		if (defaultDuration <= 0) return;
		const startPos = Math.max(0, Math.min(currentTimeMs, totalMs));
		const sorted = [...trimRegions].sort((a, b) => a.startMs - b.startMs);
		const nextRegion = sorted.find((region) => region.startMs > startPos);
		const gapToNext = nextRegion ? nextRegion.startMs - startPos : totalMs - startPos;
		const isOverlapping = sorted.some(
			(region) => startPos >= region.startMs && startPos < region.endMs,
		);
		if (isOverlapping || gapToNext <= 0) {
			toast.error(tTimeline("errors.cannotPlaceTrim"), {
				description: tTimeline("errors.trimExistsAtLocation"),
			});
			return;
		}
		const actualDuration = Math.min(defaultRegionDurationMs, gapToNext);
		handleTrimAdded({ start: startPos, end: startPos + actualDuration });
		setActiveTab("edit");
	}, [
		duration,
		totalMs,
		currentTimeMs,
		trimRegions,
		defaultRegionDurationMs,
		tTimeline,
		handleTrimAdded,
		setActiveTab,
	]);

	const handleSuggestZoomsFromBar = useCallback(async () => {
		if (!duration || duration === 0 || totalMs === 0) return;
		const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
		if (defaultDuration <= 0) return;
		if (cursorTelemetry.length < 2) {
			toast.info(tTimeline("errors.noCursorTelemetry"), {
				description: tTimeline("errors.noCursorTelemetryDescription"),
			});
			return;
		}
		const reservedSpans = [...zoomRegions]
			.map((region) => ({ start: region.startMs, end: region.endMs }))
			.sort((a, b) => a.start - b.start);
		const normalizedSamples = normalizeCursorTelemetry(cursorTelemetry, totalMs);
		if (normalizedSamples.length < 2) {
			toast.info(tTimeline("errors.noUsableTelemetry"), {
				description: tTimeline("errors.noUsableTelemetryDescription"),
			});
			return;
		}
		const dwellCandidates = detectZoomDwellCandidates(normalizedSamples);
		if (dwellCandidates.length === 0) {
			toast.info(tTimeline("errors.noDwellMoments"), {
				description: tTimeline("errors.noDwellMomentsDescription"),
			});
			return;
		}
		const SUGGESTION_SPACING_MS = 1800;
		const sortedCandidates = [...dwellCandidates].sort((a, b) => b.strength - a.strength);
		const acceptedCenters: number[] = [];
		let addedCount = 0;
		sortedCandidates.forEach((candidate) => {
			const tooCloseToAccepted = acceptedCenters.some(
				(center) => Math.abs(center - candidate.centerTimeMs) < SUGGESTION_SPACING_MS,
			);
			if (tooCloseToAccepted) return;
			const centeredStart = Math.round(candidate.centerTimeMs - defaultDuration / 2);
			const candidateStart = Math.max(0, Math.min(centeredStart, totalMs - defaultDuration));
			const candidateEnd = candidateStart + defaultDuration;
			const hasOverlap = reservedSpans.some(
				(span) => candidateEnd > span.start && candidateStart < span.end,
			);
			if (hasOverlap) return;
			reservedSpans.push({ start: candidateStart, end: candidateEnd });
			acceptedCenters.push(candidate.centerTimeMs);
			handleZoomSuggested({ start: candidateStart, end: candidateEnd }, candidate.focus);
			addedCount += 1;
		});
		if (addedCount === 0) {
			toast.info(tTimeline("errors.noAutoZoomSlots"), {
				description: tTimeline("errors.noAutoZoomSlotsDescription"),
			});
			return;
		}
		toast.success(
			addedCount === 1
				? tTimeline("success.addedZoomSuggestions", { count: String(addedCount) })
				: tTimeline("success.addedZoomSuggestionsPlural", { count: String(addedCount) }),
		);
	}, [
		duration,
		totalMs,
		defaultRegionDurationMs,
		cursorTelemetry,
		zoomRegions,
		tTimeline,
		handleZoomSuggested,
	]);

	const handleAddAnnotationFromBar = useCallback(() => {
		if (!duration || duration === 0 || totalMs === 0) return;
		const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
		if (defaultDuration <= 0) return;
		const startPos = Math.max(0, Math.min(currentTimeMs, totalMs));
		const endPos = Math.min(startPos + defaultDuration, totalMs);
		handleAnnotationAdded({ start: startPos, end: endPos });
	}, [duration, totalMs, currentTimeMs, defaultRegionDurationMs, handleAnnotationAdded]);

	const handleAddSpeedFromBar = useCallback(() => {
		if (!duration || duration === 0 || totalMs === 0) return;
		const defaultDuration = Math.min(defaultRegionDurationMs, totalMs);
		if (defaultDuration <= 0) return;
		const startPos = Math.max(0, Math.min(currentTimeMs, totalMs));
		const sorted = [...speedRegions].sort((a, b) => a.startMs - b.startMs);
		const nextRegion = sorted.find((region) => region.startMs > startPos);
		const gapToNext = nextRegion ? nextRegion.startMs - startPos : totalMs - startPos;
		const isOverlapping = sorted.some(
			(region) => startPos >= region.startMs && startPos < region.endMs,
		);
		if (isOverlapping || gapToNext <= 0) {
			toast.error(tTimeline("errors.cannotPlaceSpeed"), {
				description: tTimeline("errors.speedExistsAtLocation"),
			});
			return;
		}
		const actualDuration = Math.min(defaultRegionDurationMs, gapToNext);
		handleSpeedAdded({ start: startPos, end: startPos + actualDuration });
	}, [
		duration,
		totalMs,
		currentTimeMs,
		speedRegions,
		defaultRegionDurationMs,
		tTimeline,
		handleSpeedAdded,
	]);

	const handleAnnotationSpanChange = useCallback(
		(id: string, span: Span) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) =>
					region.id === id
						? {
								...region,
								startMs: Math.round(span.start),
								endMs: Math.round(span.end),
							}
						: region,
				),
			}));
		},
		[pushState],
	);

	const handleAnnotationDuplicate = useCallback(
		(id: string) => {
			const duplicateId = `annotation-${nextAnnotationIdRef.current++}`;
			const duplicateZIndex = nextAnnotationZIndexRef.current++;
			pushState((prev) => {
				const source = prev.annotationRegions.find((region) => region.id === id);
				if (!source) return {};

				const duplicate: AnnotationRegion = {
					...source,
					id: duplicateId,
					zIndex: duplicateZIndex,
					position: { x: source.position.x + 4, y: source.position.y + 4 },
					size: { ...source.size },
					style: { ...source.style },
					figureData: source.figureData ? { ...source.figureData } : undefined,
				};

				return { annotationRegions: [...prev.annotationRegions, duplicate] };
			});
			setSelectedAnnotationId(duplicateId);
			setSelectedZoomId(null);
			setSelectedTrimId(null);
		},
		[pushState],
	);

	const handleAnnotationDelete = useCallback(
		(id: string) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.filter((r) => r.id !== id),
			}));
			if (selectedAnnotationId === id) {
				setSelectedAnnotationId(null);
			}
			if (selectedBlurId === id) {
				setSelectedBlurId(null);
			}
		},
		[selectedAnnotationId, selectedBlurId, pushState],
	);

	const handleAnnotationContentChange = useCallback(
		(id: string, content: string) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) => {
					if (region.id !== id) return region;
					if (region.type === "text") {
						return { ...region, content, textContent: content };
					} else if (region.type === "image") {
						return { ...region, content, imageContent: content };
					}
					return { ...region, content };
				}),
			}));
		},
		[pushState],
	);

	const handleAnnotationTypeChange = useCallback(
		(id: string, type: AnnotationRegion["type"]) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) => {
					if (region.id !== id) return region;
					const updatedRegion = { ...region, type };
					if (type === "text") {
						updatedRegion.content = region.textContent || "Enter text...";
					} else if (type === "image") {
						updatedRegion.content = region.imageContent || "";
					} else if (type === "figure") {
						updatedRegion.content = "";
						if (!region.figureData) {
							updatedRegion.figureData = { ...DEFAULT_FIGURE_DATA };
						}
					} else if (type === "blur") {
						updatedRegion.content = "";
						if (!region.blurData) {
							updatedRegion.blurData = { ...DEFAULT_BLUR_DATA };
						}
					}
					return updatedRegion;
				}),
			}));

			if (type === "blur" && selectedAnnotationId === id) {
				setSelectedAnnotationId(null);
				setSelectedBlurId(id);
				setSelectedSpeedId(null);
			} else if (type !== "blur" && selectedBlurId === id) {
				setSelectedBlurId(null);
				setSelectedAnnotationId(id);
			}
		},
		[pushState, selectedAnnotationId, selectedBlurId],
	);

	const handleAnnotationStyleChange = useCallback(
		(id: string, style: Partial<AnnotationRegion["style"]>) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) =>
					region.id === id ? { ...region, style: { ...region.style, ...style } } : region,
				),
			}));
		},
		[pushState],
	);

	const handleAnnotationFigureDataChange = useCallback(
		(id: string, figureData: FigureData) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) =>
					region.id === id ? { ...region, figureData } : region,
				),
			}));
		},
		[pushState],
	);

	const handleBlurDataPreviewChange = useCallback(
		(id: string, blurData: BlurData) => {
			updateState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) =>
					region.id === id
						? {
								...region,
								blurData,
								// Freehand drawing area is the full video surface.
								...(blurData.shape === "freehand"
									? {
											position: { x: 0, y: 0 },
											size: { width: 100, height: 100 },
										}
									: {}),
							}
						: region,
				),
			}));
		},
		[updateState],
	);

	const handleBlurDataPanelChange = useCallback(
		(id: string, blurData: BlurData) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) =>
					region.id === id
						? {
								...region,
								blurData,
								...(blurData.shape === "freehand"
									? {
											position: { x: 0, y: 0 },
											size: { width: 100, height: 100 },
										}
									: {}),
							}
						: region,
				),
			}));
		},
		[pushState],
	);

	const handleAnnotationPositionChange = useCallback(
		(id: string, position: { x: number; y: number }) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) =>
					region.id === id ? { ...region, position } : region,
				),
			}));
		},
		[pushState],
	);

	const handleAnnotationSizeChange = useCallback(
		(id: string, size: { width: number; height: number }) => {
			pushState((prev) => ({
				annotationRegions: prev.annotationRegions.map((region) =>
					region.id === id ? { ...region, size } : region,
				),
			}));
		},
		[pushState],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey;
			const key = e.key.toLowerCase();

			if (mod && key === "z" && !e.shiftKey) {
				e.preventDefault();
				e.stopPropagation();
				undo();
				return;
			}
			if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
				e.preventDefault();
				e.stopPropagation();
				redo();
				return;
			}

			// Frame-step navigation (arrow keys, no modifiers)
			if (
				(e.key === "ArrowLeft" || e.key === "ArrowRight") &&
				!e.ctrlKey &&
				!e.metaKey &&
				!e.shiftKey &&
				!e.altKey
			) {
				const target = e.target;
				if (
					target instanceof HTMLInputElement ||
					target instanceof HTMLTextAreaElement ||
					target instanceof HTMLSelectElement ||
					(target instanceof HTMLElement &&
						(target.isContentEditable ||
							target.closest('[role="separator"], [role="slider"], [role="spinbutton"]')))
				) {
					return;
				}
				e.preventDefault();
				const video = videoPlaybackRef.current?.video;
				if (!video) {
					return;
				}
				const direction = e.key === "ArrowLeft" ? "backward" : "forward";
				const newTime = computeFrameStepTime(
					video.currentTime,
					Number.isFinite(video.duration) ? video.duration : durationRef.current,
					direction,
				);
				video.currentTime = newTime;
				return;
			}

			// Ctrl+K / Cmd+K: toggle command palette
			if (mod && key === "k") {
				e.preventDefault();
				setShowCommandPalette((prev) => !prev);
				return;
			}

			const isInput =
				e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

			if (e.key === "Tab" && !isInput) {
				e.preventDefault();
			}

			if (matchesShortcut(e, shortcuts.playPause, isMac)) {
				// Allow space only in inputs/textareas
				if (isInput) {
					return;
				}
				e.preventDefault();
				const playback = videoPlaybackRef.current;
				if (playback?.video) {
					playback.video.paused ? playback.play().catch(console.error) : playback.pause();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown, { capture: true });
		return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
	}, [undo, redo, shortcuts, isMac]);

	useEffect(() => {
		if (selectedZoomId && !zoomRegions.some((region) => region.id === selectedZoomId)) {
			setSelectedZoomId(null);
		}
	}, [selectedZoomId, zoomRegions]);

	useEffect(() => {
		if (selectedTrimId && !trimRegions.some((region) => region.id === selectedTrimId)) {
			setSelectedTrimId(null);
		}
	}, [selectedTrimId, trimRegions]);

	useEffect(() => {
		if (
			selectedAnnotationId &&
			!annotationOnlyRegions.some((region) => region.id === selectedAnnotationId)
		) {
			setSelectedAnnotationId(null);
		}
		if (selectedBlurId && !blurRegions.some((region) => region.id === selectedBlurId)) {
			setSelectedBlurId(null);
		}
	}, [selectedAnnotationId, selectedBlurId, annotationOnlyRegions, blurRegions]);

	useEffect(() => {
		if (selectedSpeedId && !speedRegions.some((region) => region.id === selectedSpeedId)) {
			setSelectedSpeedId(null);
		}
	}, [selectedSpeedId, speedRegions]);

	const handleExportClick = useCallback(() => {
		const video = videoPlaybackRef.current?.video;
		if (!video) return;
		exportApi.handleOpenExportDialog({
			currentTime: video.currentTime,
			videoWidth: video.videoWidth,
			videoHeight: video.videoHeight,
		});
	}, [exportApi.handleOpenExportDialog]);

	const commands = useMemo(
		() => [
			{
				id: "nav-visual",
				label: tp("items.navVisual"),
				icon: <Sparkles className="text-brand" />,
				category: "navigation" as const,
				onSelect: () => setActiveTab("visual"),
			},
			{
				id: "nav-bg",
				label: tp("items.navBackground"),
				icon: <Image className="text-brand" />,
				category: "navigation" as const,
				onSelect: () => setActiveTab("bg"),
			},
			{
				id: "nav-audio",
				label: tp("items.navAudio"),
				icon: <Volume2 className="text-brand" />,
				category: "navigation" as const,
				onSelect: () => setActiveTab("audio"),
			},
			{
				id: "nav-overlay",
				label: tp("items.navOverlay"),
				icon: <Layers className="text-brand" />,
				category: "navigation" as const,
				onSelect: () => setActiveTab("overlay"),
			},
			{
				id: "nav-annotations",
				label: tp("items.navAnnotations"),
				icon: <PenLine className="text-brand" />,
				category: "navigation" as const,
				onSelect: () => setActiveTab("annotations"),
			},
			{
				id: "nav-edit",
				label: tp("items.navEdit"),
				icon: <Scissors className="text-brand" />,
				category: "navigation" as const,
				onSelect: () => setActiveTab("edit"),
			},
			{
				id: "tool-zoom",
				label: tp("items.toolZoom"),
				icon: <ZoomIn className="text-brand" />,
				category: "tools" as const,
				keywords: ["add zoom", "zoom region"],
				shortcut: "Z",
				onSelect: handleAddZoomFromBar,
			},
			{
				id: "tool-speed",
				label: tp("items.toolSpeed"),
				icon: <Zap className="text-brand" />,
				category: "tools" as const,
				keywords: ["add speed", "speed region"],
				shortcut: "S",
				onSelect: handleAddSpeedFromBar,
			},
			{
				id: "tool-text",
				label: tp("items.toolText"),
				icon: <Type className="text-brand" />,
				category: "tools" as const,
				keywords: ["add text", "annotation"],
				shortcut: "A",
				onSelect: handleAddAnnotationFromBar,
			},
			{
				id: "tool-audio",
				label: tp("items.toolAudio"),
				icon: <Music className="text-brand" />,
				category: "tools" as const,
				keywords: ["add audio", "background music"],
				onSelect: () => setActiveTab("audio"),
			},
			{
				id: "tool-webcam",
				label: tp("items.toolWebcam"),
				icon: <Video className="text-brand" />,
				category: "tools" as const,
				keywords: ["webcam pip", "picture in picture", "camera"],
				onSelect: () => setActiveTab("overlay"),
			},
			{
				id: "tool-auto-enhance",
				label: tp("items.toolAutoEnhance"),
				icon: <WandSparkles className="text-brand" />,
				category: "tools" as const,
				keywords: ["auto enhance", "auto zoom", "suggestions"],
				onSelect: handleSuggestZoomsFromBar,
			},
			{
				id: "action-export",
				label: tp("items.actionExport"),
				icon: <Download className="text-brand" />,
				category: "actions" as const,
				keywords: ["mp4", "gif", "render", "save video"],
				onSelect: handleExportClick,
			},
			{
				id: "action-new-recording",
				label: tp("items.actionNewRecording"),
				icon: <Video className="text-brand" />,
				category: "actions" as const,
				keywords: ["new recording", "record screen"],
				onSelect: () => setShowNewRecordingDialog(true),
			},
			{
				id: "action-save",
				label: tp("items.actionSave"),
				icon: <Save className="text-brand" />,
				category: "actions" as const,
				keywords: ["save project", "save"],
				onSelect: handleSaveProject,
			},
			{
				id: "action-load",
				label: tp("items.actionLoad"),
				icon: <FolderOpen className="text-brand" />,
				category: "actions" as const,
				keywords: ["load project", "open project"],
				onSelect: handleLoadProject,
			},
			{
				id: "action-undo",
				label: tp("items.actionUndo"),
				icon: <Undo2 className="text-brand" />,
				category: "actions" as const,
				shortcut: "⌘Z",
				onSelect: undo,
			},
			{
				id: "action-redo",
				label: tp("items.actionRedo"),
				icon: <Redo2 className="text-brand" />,
				category: "actions" as const,
				shortcut: "⌘⇧Z",
				onSelect: redo,
			},
			{
				id: "action-fullscreen",
				label: tp("items.actionFullscreen"),
				icon: <Maximize className="text-brand" />,
				category: "actions" as const,
				keywords: ["full screen", "maximize"],
				onSelect: toggleFullscreen,
			},
			{
				id: "setting-shortcuts",
				label: tp("items.settingShortcuts"),
				icon: <Keyboard className="text-brand" />,
				category: "settings" as const,
				keywords: ["keyboard shortcuts", "hotkeys", "keys"],
				onSelect: openConfig,
			},
		],
		[
			tp,
			handleAddZoomFromBar,
			handleAddSpeedFromBar,
			handleAddAnnotationFromBar,
			handleSuggestZoomsFromBar,
			handleExportClick,
			handleSaveProject,
			handleLoadProject,
			undo,
			redo,
			openConfig,
			toggleFullscreen,
		],
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-background">
				<div className="text-foreground">{t("loadingVideo")}</div>
			</div>
		);
	}
	if (error) {
		return (
			<div className="flex items-center justify-center h-screen bg-background">
				<div className="flex flex-col items-center gap-3">
					<div className="text-destructive">{error}</div>
					<button
						type="button"
						onClick={handleLoadProject}
						className="px-3 py-1.5 rounded-md bg-brand text-white text-sm hover:bg-brand/90"
					>
						{ts("project.load")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen bg-[#07070c] text-slate-200 overflow-hidden selection:bg-brand/30">
			<Dialog open={showNewRecordingDialog} onOpenChange={setShowNewRecordingDialog}>
				<DialogContent
					className="sm:max-w-[425px]"
					style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
				>
					<DialogHeader>
						<DialogTitle>{t("newRecording.title")}</DialogTitle>
						<DialogDescription>{t("newRecording.description")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<button
							type="button"
							onClick={() => setShowNewRecordingDialog(false)}
							className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 text-sm font-medium transition-colors"
						>
							{t("newRecording.cancel")}
						</button>
						<button
							type="button"
							onClick={handleNewRecordingConfirm}
							className="px-4 py-2 rounded-md bg-brand text-white hover:bg-brand/90 text-sm font-medium transition-colors"
						>
							{t("newRecording.confirm")}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Titlebar
				isMac={isMac}
				locale={locale}
				setLocale={setLocale}
				videoPath={videoPath}
				undoCount={undoCount}
				redoCount={redoCount}
				onUndo={undo}
				onRedo={redo}
				onExport={handleExportClick}
				onSearch={() => setShowCommandPalette(true)}
				onShortcuts={openConfig}
				onNewRecording={() => setShowNewRecordingDialog(true)}
				onLoadProject={handleLoadProject}
				onSaveProject={handleSaveProject}
				unsaved={hasUnsavedChanges}
			/>

			<div className="flex-1 flex min-h-0 relative">
				<PanelGroup direction="vertical" className="flex-1 min-h-0">
					{/* Upper section: Canvas + SettingsPanel */}
					<Panel defaultSize={70} minSize={40}>
						<div className="flex h-full">
							{/* Left: Video preview + playback controls */}
							<div className="flex-1 flex flex-col min-w-0 h-full">
								<div
									ref={playerContainerRef}
									className={
										isFullscreen
											? "fixed inset-0 z-[99999] w-full h-full flex flex-col items-center justify-center bg-[#07070c]"
											: "flex-1 flex flex-col items-center justify-center bg-[#0a0a10] border-r border-white/[0.04] overflow-hidden relative"
									}
								>
									{/* Video preview */}
									<div className="w-full flex justify-center items-center flex-auto mt-1.5">
										<div
											className="relative flex justify-center items-center w-auto h-full max-w-full box-border"
											style={{
												aspectRatio:
													aspectRatio === "native"
														? getNativeAspectRatioValue(
																videoPlaybackRef.current?.video?.videoWidth || 1920,
																videoPlaybackRef.current?.video?.videoHeight || 1080,
																cropRegion,
															)
														: getAspectRatioValue(aspectRatio),
											}}
										>
											<VideoPlayback
												key={`${videoPath || "no-video"}:${webcamVideoPath || "no-webcam"}`}
												aspectRatio={aspectRatio}
												ref={videoPlaybackRef}
												videoPath={videoPath || ""}
												webcamVideoPath={webcamVideoPath || undefined}
												webcamLayoutPreset={webcamLayoutPreset}
												webcamMaskShape={webcamMaskShape}
												webcamSizePreset={webcamSizePreset}
												webcamPosition={webcamPosition}
												onWebcamPositionChange={(pos) => updateState({ webcamPosition: pos })}
												onWebcamPositionDragEnd={commitState}
												onDurationChange={setDuration}
												onTimeUpdate={setCurrentTime}
												currentTime={currentTime}
												onPlayStateChange={setIsPlaying}
												onError={setError}
												wallpaper={wallpaper}
												zoomRegions={zoomRegions}
												selectedZoomId={selectedZoomId}
												onSelectZoom={handleSelectZoom}
												onZoomFocusChange={handleZoomFocusChange}
												onZoomFocusDragEnd={commitState}
												isPlaying={isPlaying}
												showShadow={shadowIntensity > 0}
												shadowIntensity={shadowIntensity}
												showBlur={showBlur}
												motionBlurAmount={motionBlurAmount}
												borderRadius={borderRadius}
												padding={padding}
												cropRegion={cropRegion}
												trimRegions={trimRegions}
												speedRegions={speedRegions}
												annotationRegions={annotationOnlyRegions}
												selectedAnnotationId={selectedAnnotationId}
												onSelectAnnotation={handleSelectAnnotation}
												onAnnotationPositionChange={handleAnnotationPositionChange}
												onAnnotationSizeChange={handleAnnotationSizeChange}
												blurRegions={blurRegions}
												selectedBlurId={selectedBlurId}
												onSelectBlur={handleSelectBlur}
												onBlurPositionChange={handleAnnotationPositionChange}
												onBlurSizeChange={handleAnnotationSizeChange}
												onBlurDataChange={handleBlurDataPreviewChange}
												onBlurDataCommit={commitState}
												cursorTelemetry={cursorTelemetry}
											/>
										</div>
									</div>
									{/* Playback bar — shown here only in fullscreen mode */}
									{isFullscreen && (
										<PlaybackBar
											isPlaying={isPlaying}
											currentTime={currentTime}
											duration={duration}
											isFullscreen={isFullscreen}
											onToggleFullscreen={toggleFullscreen}
											onTogglePlayPause={togglePlayPause}
											onSeek={handleSeek}
											onGoToStart={() => handleSeek(0)}
											onGoToEnd={() => handleSeek(duration)}
											onAddZoom={handleAddZoomFromBar}
											onAutoEnhance={handleSuggestZoomsFromBar}
											onTrim={handleAddTrimFromBar}
											onAddSpeed={handleAddSpeedFromBar}
											onAddText={handleAddAnnotationFromBar}
											onAddAudio={() => setActiveTab("audio")}
											onWebcamPip={() => setActiveTab("overlay")}
										/>
									)}
								</div>
							</div>

							{/* Right: SidePanel + TabRail */}
							{activeTab && (
								<SidePanel
									activeTab={activeTab}
									onClose={() => setActiveTab(null)}
									width={sidePanelWidth}
									onWidthChange={setSidePanelWidth}
								>
									{activeTab === "visual" ? (
										<PanelVisual
											selectedZoomDepth={
												selectedZoomId
													? zoomRegions.find((z) => z.id === selectedZoomId)?.depth
													: null
											}
											onZoomDepthChange={(depth) => selectedZoomId && handleZoomDepthChange(depth)}
											selectedZoomFocusMode={
												selectedZoomId
													? (zoomRegions.find((z) => z.id === selectedZoomId)?.focusMode ??
														"manual")
													: null
											}
											onZoomFocusModeChange={(mode) =>
												selectedZoomId && handleZoomFocusModeChange(mode)
											}
											hasCursorTelemetry={cursorTelemetry.length > 0}
											selectedZoomId={selectedZoomId}
											onZoomDelete={handleZoomDelete}
											selectedTrimId={selectedTrimId}
											onTrimDelete={handleTrimDelete}
											selectedSpeedId={selectedSpeedId}
											selectedSpeedValue={
												selectedSpeedId
													? (speedRegions.find((r) => r.id === selectedSpeedId)?.speed ?? null)
													: null
											}
											onSpeedChange={handleSpeedChange}
											onSpeedDelete={handleSpeedDelete}
											showBlur={showBlur}
											onBlurChange={(v) => pushState({ showBlur: v })}
											motionBlurAmount={motionBlurAmount}
											onMotionBlurChange={(v) => updateState({ motionBlurAmount: v })}
											onMotionBlurCommit={commitState}
											shadowIntensity={shadowIntensity}
											onShadowChange={(v) => updateState({ shadowIntensity: v })}
											onShadowCommit={commitState}
											borderRadius={borderRadius}
											onBorderRadiusChange={(v) => updateState({ borderRadius: v })}
											onBorderRadiusCommit={commitState}
											padding={padding}
											onPaddingChange={(v) => updateState({ padding: v })}
											onPaddingCommit={commitState}
										/>
									) : activeTab === "bg" ? (
										<PanelBackground
											selected={wallpaper}
											onWallpaperChange={(w) => pushState({ wallpaper: w })}
										/>
									) : activeTab === "audio" ? (
										<PanelAudio hasWebcam={Boolean(webcamVideoPath)} />
									) : activeTab === "overlay" ? (
										<PanelOverlay
											hasWebcam={Boolean(webcamVideoPath)}
											webcamLayoutPreset={webcamLayoutPreset}
											onWebcamLayoutPresetChange={(preset) =>
												pushState({
													webcamLayoutPreset: preset,
													webcamPosition: preset === "picture-in-picture" ? webcamPosition : null,
												})
											}
											webcamMaskShape={webcamMaskShape}
											onWebcamMaskShapeChange={(shape) => pushState({ webcamMaskShape: shape })}
											webcamSizePreset={webcamSizePreset}
											onWebcamSizePresetChange={(v) => updateState({ webcamSizePreset: v })}
											onWebcamSizePresetCommit={commitState}
											aspectRatio={aspectRatio}
										/>
									) : activeTab === "annotations" ? (
										<PanelAnnotations
											selectedAnnotationId={selectedAnnotationId}
											annotationRegions={annotationOnlyRegions}
											onAnnotationSelect={handleSelectAnnotation}
											onAnnotationContentChange={handleAnnotationContentChange}
											onAnnotationTypeChange={handleAnnotationTypeChange}
											onAnnotationStyleChange={handleAnnotationStyleChange}
											onAnnotationFigureDataChange={handleAnnotationFigureDataChange}
											onAnnotationDuplicate={handleAnnotationDuplicate}
											onAnnotationDelete={handleAnnotationDelete}
											selectedBlurId={selectedBlurId}
											blurRegions={blurRegions}
											onBlurSelect={handleSelectBlur}
											onBlurDataChange={handleBlurDataPanelChange}
											onBlurDataCommit={commitState}
											onBlurDelete={handleAnnotationDelete}
										/>
									) : activeTab === "edit" ? (
										<PanelEdit
											trimRegions={trimRegions}
											selectedTrimId={selectedTrimId}
											onTrimDelete={handleTrimDelete}
										/>
									) : null}
								</SidePanel>
							)}
							<TabRail activeTab={activeTab} onSelect={setActiveTab} />
						</div>
					</Panel>

					<PanelResizeHandle className="bg-[#06060b] hover:bg-[#0a0a11] transition-colors flex items-center justify-center h-1.5">
						<div className="w-8 h-1 bg-white/15 rounded-full"></div>
					</PanelResizeHandle>

					{/* Lower section: PlaybackBar (full width) + Timeline */}
					<Panel defaultSize={35} maxSize={60} minSize={28}>
						<div className="h-full bg-[#07070c] overflow-hidden flex flex-col">
							{/* Playback bar — full width, above the timeline */}
							<PlaybackBar
								isPlaying={isPlaying}
								currentTime={currentTime}
								duration={duration}
								isFullscreen={isFullscreen}
								onToggleFullscreen={toggleFullscreen}
								onTogglePlayPause={togglePlayPause}
								onSeek={handleSeek}
								onGoToStart={() => handleSeek(0)}
								onGoToEnd={() => handleSeek(duration)}
								onAddZoom={handleAddZoomFromBar}
								onAutoEnhance={handleSuggestZoomsFromBar}
								onTrim={handleAddTrimFromBar}
								onAddSpeed={handleAddSpeedFromBar}
								onAddText={handleAddAnnotationFromBar}
								onAddAudio={() => setActiveTab("audio")}
								onWebcamPip={() => setActiveTab("overlay")}
							/>
							<TimelineEditor
								videoDuration={duration}
								currentTime={currentTime}
								onSeek={handleSeek}
								zoomRegions={zoomRegions}
								onZoomAdded={handleZoomAdded}
								onZoomSpanChange={handleZoomSpanChange}
								onZoomDelete={handleZoomDelete}
								selectedZoomId={selectedZoomId}
								onSelectZoom={handleSelectZoom}
								trimRegions={trimRegions}
								onTrimAdded={handleTrimAdded}
								onTrimSpanChange={handleTrimSpanChange}
								onTrimDelete={handleTrimDelete}
								selectedTrimId={selectedTrimId}
								onSelectTrim={handleSelectTrim}
								speedRegions={speedRegions}
								onSpeedAdded={handleSpeedAdded}
								onSpeedSpanChange={handleSpeedSpanChange}
								onSpeedDelete={handleSpeedDelete}
								selectedSpeedId={selectedSpeedId}
								onSelectSpeed={handleSelectSpeed}
								annotationRegions={annotationOnlyRegions}
								onAnnotationAdded={handleAnnotationAdded}
								onAnnotationSpanChange={handleAnnotationSpanChange}
								onAnnotationDelete={handleAnnotationDelete}
								selectedAnnotationId={selectedAnnotationId}
								onSelectAnnotation={handleSelectAnnotation}
								blurRegions={blurRegions}
								onBlurAdded={handleBlurAdded}
								onBlurSpanChange={handleAnnotationSpanChange}
								onBlurDelete={handleAnnotationDelete}
								selectedBlurId={selectedBlurId}
								onSelectBlur={handleSelectBlur}
								aspectRatio={aspectRatio}
								onAspectRatioChange={(ar) =>
									pushState({
										aspectRatio: ar,
										webcamLayoutPreset:
											(isPortraitAspectRatio(ar) && webcamLayoutPreset === "dual-frame") ||
											(!isPortraitAspectRatio(ar) && webcamLayoutPreset === "vertical-stack")
												? "picture-in-picture"
												: webcamLayoutPreset,
									})
								}
							/>
						</div>
					</Panel>
				</PanelGroup>
			</div>

			<ExportDialog
				isOpen={showExportDialog}
				onClose={() => exportApi.setShowExportDialog(false)}
				progress={exportProgress}
				isExporting={isExporting}
				error={exportError}
				onCancel={exportApi.handleCancelExport}
				exportFormat={exportFormat}
				exportedFilePath={exportedFilePath || undefined}
				onShowInFolder={
					exportedFilePath
						? () => void exportApi.handleShowExportedFile(exportedFilePath)
						: undefined
				}
			/>

			<CommandPalette
				open={showCommandPalette}
				onOpenChange={setShowCommandPalette}
				commands={commands}
			/>
		</div>
	);
}
