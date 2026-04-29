import { Crop, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScopedT } from "@/contexts/I18nContext";
import type { TrimRegion } from "../types";

interface PanelEditProps {
	trimRegions: TrimRegion[];
	selectedTrimId?: string | null;
	onTrimDelete?: (id: string) => void;
}

function formatMs(ms: number): string {
	const totalSeconds = ms / 1000;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);
	const millis = Math.floor(ms % 1000);
	return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export default function PanelEdit({ trimRegions, selectedTrimId, onTrimDelete }: PanelEditProps) {
	const t = useScopedT("settings");

	const selectedTrim = selectedTrimId
		? trimRegions.find((r) => r.id === selectedTrimId)
		: undefined;

	return (
		<div className="space-y-4">
			{/* Crop */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Crop className="w-3.5 h-3.5 text-[#34B27B]" />
					<span className="text-xs font-semibold text-slate-200">Crop</span>
				</div>
				<Button
					variant="outline"
					className="w-full gap-1.5 bg-white/5 text-slate-200 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white text-[11px] h-8 transition-all"
				>
					<Crop className="w-3 h-3" />
					{t("crop.cropVideo")}
				</Button>
			</div>

			{/* Trim */}
			{selectedTrim && (
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Scissors className="w-3.5 h-3.5 text-[#34B27B]" />
						<span className="text-xs font-semibold text-slate-200">Trim</span>
					</div>
					<div className="space-y-1.5 mb-3">
						<div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
							<span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
								In:
							</span>
							<span className="text-xs text-slate-200 font-mono tabular-nums">
								{formatMs(selectedTrim.startMs)}
							</span>
						</div>
						<div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
							<span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
								Out:
							</span>
							<span className="text-xs text-slate-200 font-mono tabular-nums">
								{formatMs(selectedTrim.endMs)}
							</span>
						</div>
					</div>
					<button
						onClick={() => selectedTrimId && onTrimDelete?.(selectedTrimId)}
						className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all"
					>
						<Trash2 className="w-3 h-3" />
						{t("trim.deleteRegion")}
					</button>
				</div>
			)}
		</div>
	);
}
