import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { AnnotationSettingsPanel } from "../AnnotationSettingsPanel";
import { BlurSettingsPanel } from "../BlurSettingsPanel";
import type { AnnotationRegion, AnnotationType, BlurData, FigureData } from "../types";

interface PanelAnnotationsProps {
	selectedAnnotationId?: string | null;
	annotationRegions?: AnnotationRegion[];
	onAnnotationSelect?: (id: string) => void;
	onAnnotationContentChange?: (id: string, content: string) => void;
	onAnnotationTypeChange?: (id: string, type: AnnotationType) => void;
	onAnnotationStyleChange?: (id: string, style: Partial<AnnotationRegion["style"]>) => void;
	onAnnotationFigureDataChange?: (id: string, figureData: FigureData) => void;
	onAnnotationDuplicate?: (id: string) => void;
	onAnnotationDelete?: (id: string) => void;
	selectedBlurId?: string | null;
	blurRegions?: AnnotationRegion[];
	onBlurSelect?: (id: string) => void;
	onBlurDataChange?: (id: string, blurData: BlurData) => void;
	onBlurDataCommit?: () => void;
	onBlurDelete?: (id: string) => void;
}

export default function PanelAnnotations({
	selectedAnnotationId,
	annotationRegions = [],
	onAnnotationSelect,
	onAnnotationContentChange,
	onAnnotationTypeChange,
	onAnnotationStyleChange,
	onAnnotationFigureDataChange,
	onAnnotationDuplicate,
	onAnnotationDelete,
	selectedBlurId,
	blurRegions = [],
	onBlurSelect,
	onBlurDataChange,
	onBlurDataCommit,
	onBlurDelete,
}: PanelAnnotationsProps) {
	const selectedAnnotation = selectedAnnotationId
		? annotationRegions.find((a) => a.id === selectedAnnotationId)
		: null;
	if (
		selectedAnnotation &&
		onAnnotationContentChange &&
		onAnnotationTypeChange &&
		onAnnotationStyleChange &&
		onAnnotationDelete
	) {
		return (
			<AnnotationSettingsPanel
				annotation={selectedAnnotation}
				onContentChange={(content) => onAnnotationContentChange(selectedAnnotation.id, content)}
				onTypeChange={(type) => onAnnotationTypeChange(selectedAnnotation.id, type)}
				onStyleChange={(style) => onAnnotationStyleChange(selectedAnnotation.id, style)}
				onFigureDataChange={
					onAnnotationFigureDataChange
						? (fd) => onAnnotationFigureDataChange(selectedAnnotation.id, fd)
						: undefined
				}
				onDuplicate={
					onAnnotationDuplicate ? () => onAnnotationDuplicate(selectedAnnotation.id) : undefined
				}
				onDelete={() => onAnnotationDelete(selectedAnnotation.id)}
			/>
		);
	}

	const selectedBlur = selectedBlurId ? blurRegions.find((r) => r.id === selectedBlurId) : null;
	if (selectedBlur && onBlurDataChange && onBlurDelete) {
		return (
			<BlurSettingsPanel
				blurRegion={selectedBlur}
				onBlurDataChange={(blurData) => onBlurDataChange(selectedBlur.id, blurData)}
				onBlurDataCommit={onBlurDataCommit}
				onDelete={() => onBlurDelete(selectedBlur.id)}
			/>
		);
	}

	return (
		<div className="space-y-4">
			{annotationRegions.length > 0 && (
				<div>
					<span className="text-xs font-semibold text-slate-200 mb-2 block">Annotations</span>
					<div className="space-y-1">
						{annotationRegions.map((a) => (
							<button
								key={a.id}
								type="button"
								onClick={() => onAnnotationSelect?.(a.id)}
								className={cn(
									"w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition-all border",
									selectedAnnotationId === a.id
										? "bg-white/10 border-white/20 text-white"
										: "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10",
								)}
							>
								{a.content || a.type}
							</button>
						))}
					</div>
				</div>
			)}

			{blurRegions.length > 0 && (
				<div>
					<span className="text-xs font-semibold text-slate-200 mb-2 block">Blur regions</span>
					<div className="space-y-1">
						{blurRegions.map((b) => (
							<button
								key={b.id}
								type="button"
								onClick={() => onBlurSelect?.(b.id)}
								className={cn(
									"w-full text-left px-2 py-1.5 rounded-lg text-[10px] transition-all border",
									selectedBlurId === b.id
										? "bg-white/10 border-white/20 text-white"
										: "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10",
								)}
							>
								{b.type}
							</button>
						))}
					</div>
				</div>
			)}

			{annotationRegions.length === 0 && blurRegions.length === 0 && (
				<EmptyState message="Select an annotation or blur region on the timeline to edit its properties." />
			)}
		</div>
	);
}
