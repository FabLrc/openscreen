import { Crop, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScopedT } from "@/contexts/I18nContext";

interface PanelEditProps {
	selectedTrimId?: string | null;
	onTrimDelete?: (id: string) => void;
}

export default function PanelEdit({ selectedTrimId, onTrimDelete }: PanelEditProps) {
	const t = useScopedT("settings");

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
			{selectedTrimId && (
				<div>
					<div className="flex items-center gap-2 mb-2">
						<Scissors className="w-3.5 h-3.5 text-[#34B27B]" />
						<span className="text-xs font-semibold text-slate-200">Trim</span>
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

			{/* Split info */}
			<div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
				<span className="text-[10px] text-slate-400 leading-relaxed block">
					Use the Split tool in the timeline toolbar to split clips at the playhead. Keyboard
					shortcut: <span className="text-slate-300 font-medium">S</span>
				</span>
			</div>
		</div>
	);
}
