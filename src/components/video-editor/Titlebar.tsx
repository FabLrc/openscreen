import {
	Download,
	FolderOpen,
	Keyboard,
	Languages,
	Redo2,
	Save,
	Search,
	Undo2,
	Video,
} from "lucide-react";
import { useI18n, useScopedT } from "@/contexts/I18nContext";
import { type Locale } from "@/i18n/config";
import { getAvailableLocales, getLocaleName } from "@/i18n/loader";

interface TitlebarProps {
	isMac: boolean;
	locale: Locale;
	setLocale: (locale: Locale) => void;
	videoPath: string | null;
	undoCount: number;
	redoCount: number;
	onUndo: () => void;
	onRedo: () => void;
	onExport: () => void;
	onSearch: () => void;
	onShortcuts: () => void;
	onNewRecording: () => void;
	onLoadProject: () => void;
	onSaveProject: () => void;
	unsaved: boolean;
}

function fileNameFromPath(path: string | null): string {
	if (!path) return "Untitled Recording";
	const parts = path.split(/[\\/]/);
	const name = parts.pop();
	return name || "Untitled Recording";
}

export default function Titlebar({
	isMac,
	locale,
	setLocale,
	videoPath,
	undoCount,
	redoCount,
	onUndo,
	onRedo,
	onExport,
	onSearch,
	onShortcuts,
	onNewRecording,
	onLoadProject,
	onSaveProject,
	unsaved,
}: TitlebarProps) {
	const { t } = useI18n();
	const ts = useScopedT("editor");

	return (
		<div
			className="h-[42px] flex-shrink-0 bg-[#0a0a11] border-b border-white/5 flex items-center justify-between px-3 z-50"
			style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
		>
			{/* Left */}
			<div
				className="flex items-center gap-2"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				{/* App icon */}
				<div className={`flex items-center gap-1.5 ${isMac ? "ml-14" : "ml-1"}`}>
					<div className="w-5 h-5 rounded-[5px] bg-brand/20 flex items-center justify-center">
						<Video size={12} className="text-brand" />
					</div>
					<span className="text-[13px] font-semibold text-[#eceff6]">
						{fileNameFromPath(videoPath)}
					</span>
					{unsaved && (
						<>
							<div className="w-[3px] h-[3px] rounded-full bg-white/20" />
							<span className="text-[10px] text-white/40 font-medium">{ts("unsaved")}</span>
						</>
					)}
				</div>

				{/* Divider */}
				<div className="w-px h-4 bg-white/10 mx-0.5" />

				{/* Language selector */}
				<div className="flex items-center gap-1 px-1.5 py-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150">
					<Languages size={12} />
					<select
						value={locale}
						onChange={(e) => setLocale(e.target.value as Locale)}
						className="bg-transparent text-[10px] font-medium outline-none cursor-pointer appearance-none pr-1"
						style={{ color: "inherit" }}
					>
						{getAvailableLocales().map((loc) => (
							<option key={loc} value={loc} className="bg-[#09090b] text-white">
								{getLocaleName(loc)}
							</option>
						))}
					</select>
				</div>

				{/* Project actions */}
				<button
					type="button"
					onClick={onNewRecording}
					className="flex items-center gap-1 px-1.5 py-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150 text-[10px] font-medium"
					title={t("newRecording.title")}
				>
					<Video size={12} />
				</button>
				<button
					type="button"
					onClick={onLoadProject}
					className="flex items-center gap-1 px-1.5 py-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150 text-[10px] font-medium"
					title={ts("project.load")}
				>
					<FolderOpen size={12} />
				</button>
				<button
					type="button"
					onClick={onSaveProject}
					className="flex items-center gap-1 px-1.5 py-1 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150 text-[10px] font-medium"
					title={ts("project.save")}
				>
					<Save size={12} />
				</button>
			</div>

			{/* Right */}
			<div
				className="flex items-center gap-1.5"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				{/* Undo */}
				<button
					type="button"
					onClick={onUndo}
					disabled={undoCount === 0}
					title={`Undo (${undoCount})`}
					className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/80 hover:bg-white/[0.06] disabled:text-white/20 disabled:cursor-default transition-all duration-120"
				>
					<Undo2 size={11} />
					{undoCount > 0 && (
						<span className="text-[9px] text-white/40 font-medium tabular-nums">{undoCount}</span>
					)}
				</button>

				{/* Redo */}
				<button
					type="button"
					onClick={onRedo}
					disabled={redoCount === 0}
					title={`Redo (${redoCount})`}
					className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/80 hover:bg-white/[0.06] disabled:text-white/20 disabled:cursor-default transition-all duration-120"
				>
					<Redo2 size={11} />
					{redoCount > 0 && (
						<span className="text-[9px] text-white/40 font-medium tabular-nums">{redoCount}</span>
					)}
				</button>

				{/* Divider */}
				<div className="w-px h-4 bg-white/10 mx-0.5" />

				{/* Search */}
				<button
					type="button"
					onClick={onSearch}
					title="Quick search (⌘K)"
					className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-120"
				>
					<Search size={12} />
					<kbd className="text-[9px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded px-1 font-sans">
						{isMac ? "⌘K" : "Ctrl+K"}
					</kbd>
				</button>

				{/* Keyboard shortcuts */}
				<button
					type="button"
					onClick={onShortcuts}
					title="Keyboard shortcuts"
					className="w-7 h-7 rounded-md border border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all duration-120 flex items-center justify-center"
				>
					<Keyboard size={13} />
				</button>

				{/* Divider */}
				<div className="w-px h-4 bg-white/10 mx-0.5" />

				{/* Export */}
				<button
					type="button"
					onClick={onExport}
					className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-brand text-white text-[11px] font-semibold hover:bg-brand/90 shadow-[0_2px_12px_rgba(52,178,123,0.25)] transition-all duration-120"
				>
					<Download size={12} />
					Export
				</button>
			</div>
		</div>
	);
}
