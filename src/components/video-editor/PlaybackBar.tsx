import {
	Gauge,
	Maximize,
	MessageSquare,
	Minimize,
	Pause,
	Play,
	Scissors,
	SkipBack,
	SkipForward,
	WandSparkles,
	ZoomIn,
} from "lucide-react";
import { useScopedT } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface PlaybackBarProps {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	isFullscreen?: boolean;
	onToggleFullscreen?: () => void;
	onTogglePlayPause: () => void;
	onSeek: (time: number) => void;
	onStepBackward?: () => void;
	onStepForward?: () => void;
	onAddZoom?: () => void;
	onSuggestZooms?: () => void;
	onAddTrim?: () => void;
	onAddAnnotation?: () => void;
	onAddBlur?: () => void;
	onAddSpeed?: () => void;
}

export default function PlaybackBar({
	isPlaying,
	currentTime,
	duration,
	isFullscreen = false,
	onToggleFullscreen,
	onTogglePlayPause,
	onSeek,
	onStepBackward,
	onStepForward,
	onAddZoom,
	onSuggestZooms,
	onAddTrim,
	onAddAnnotation,
	onAddBlur,
	onAddSpeed,
}: PlaybackBarProps) {
	const tCommon = useScopedT("common");
	const t = useScopedT("timeline");

	function formatTime(seconds: number) {
		if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
		onSeek(parseFloat(e.target.value));
	}

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
	const hasVideo = duration > 0;

	return (
		<div className="flex items-center gap-3 px-3 py-2 bg-[#09090b] border-t border-white/5">
			{/* Left: Playback controls */}
			<div className="flex items-center gap-1 shrink-0">
				<Button
					onClick={onStepBackward}
					disabled={!hasVideo}
					size="icon"
					variant="ghost"
					className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
					title="Previous frame"
				>
					<SkipBack className="w-4 h-4" />
				</Button>

				<Button
					onClick={onTogglePlayPause}
					disabled={!hasVideo}
					size="icon"
					className={cn(
						"h-8 w-8 rounded-full transition-all duration-200 border",
						isPlaying
							? "bg-white/10 text-white border-white/10 hover:bg-white/20"
							: "bg-[#34B27B] text-white border-[#34B27B] hover:bg-[#2d9e6d] hover:scale-105",
					)}
					aria-label={isPlaying ? tCommon("playback.pause") : tCommon("playback.play")}
				>
					{isPlaying ? (
						<Pause className="w-3.5 h-3.5 fill-current" />
					) : (
						<Play className="w-3.5 h-3.5 fill-current ml-0.5" />
					)}
				</Button>

				<Button
					onClick={onStepForward}
					disabled={!hasVideo}
					size="icon"
					variant="ghost"
					className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
					title="Next frame"
				>
					<SkipForward className="w-4 h-4" />
				</Button>

				<span className="text-[11px] font-medium text-slate-300 tabular-nums ml-1">
					{formatTime(currentTime)}
					<span className="text-slate-500"> / {formatTime(duration)}</span>
				</span>
			</div>

			{/* Center: Seek bar */}
			<div className="flex-1 relative h-6 flex items-center group">
				<div className="absolute left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
					<div className="h-full bg-[#34B27B] rounded-full" style={{ width: `${progress}%` }} />
				</div>
				<input
					type="range"
					min="0"
					max={duration || 100}
					value={currentTime}
					onChange={handleSeekChange}
					step="0.01"
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
				/>
				<div
					className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-lg pointer-events-none group-hover:scale-125 transition-transform duration-100"
					style={{
						left: `${progress}%`,
						transform: "translateX(-50%)",
					}}
				/>
			</div>

			{/* Right: Quick tools */}
			<div className="flex items-center gap-0.5 shrink-0">
				<Button
					onClick={onAddZoom}
					disabled={!hasVideo}
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-slate-400 hover:text-[#34B27B] hover:bg-[#34B27B]/10 transition-all disabled:opacity-30"
					title={t("buttons.addZoom")}
				>
					<ZoomIn className="w-4 h-4" />
				</Button>
				<Button
					onClick={onSuggestZooms}
					disabled={!hasVideo}
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-slate-400 hover:text-[#34B27B] hover:bg-[#34B27B]/10 transition-all disabled:opacity-30"
					title={t("buttons.suggestZooms")}
				>
					<WandSparkles className="w-4 h-4" />
				</Button>
				<Button
					onClick={onAddTrim}
					disabled={!hasVideo}
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-slate-400 hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all disabled:opacity-30"
					title={t("buttons.addTrim")}
				>
					<Scissors className="w-4 h-4" />
				</Button>
				<Button
					onClick={onAddAnnotation}
					disabled={!hasVideo}
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-slate-400 hover:text-[#B4A046] hover:bg-[#B4A046]/10 transition-all disabled:opacity-30"
					title={t("buttons.addAnnotation")}
				>
					<MessageSquare className="w-4 h-4" />
				</Button>
				<Button
					onClick={onAddBlur}
					disabled={!hasVideo}
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-slate-400 hover:text-[#7dd3fc] hover:bg-[#7dd3fc]/10 transition-all disabled:opacity-30"
					title={t("buttons.addBlur")}
				>
					<svg
						className="w-4 h-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<circle cx="8" cy="12" r="3" />
						<circle cx="16" cy="12" r="3" />
						<path d="M6 6h12M6 18h12" />
					</svg>
				</Button>
				<Button
					onClick={onAddSpeed}
					disabled={!hasVideo}
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-slate-400 hover:text-[#d97706] hover:bg-[#d97706]/10 transition-all disabled:opacity-30"
					title={t("buttons.addSpeed")}
				>
					<Gauge className="w-4 h-4" />
				</Button>

				{onToggleFullscreen && (
					<>
						<div className="w-[1px] h-4 bg-white/10 mx-1" />
						<Button
							onClick={onToggleFullscreen}
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
							aria-label={
								isFullscreen ? tCommon("playback.exitFullscreen") : tCommon("playback.fullscreen")
							}
						>
							{isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
