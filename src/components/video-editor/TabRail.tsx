import { Image, Layers, PenLine, Scissors, Sparkles, Volume2 } from "lucide-react";

interface TabDef {
	id: string;
	label: string;
	icon: React.ReactNode;
}

const TABS: TabDef[] = [
	{
		id: "visual",
		label: "Visual",
		icon: <Sparkles size={15} strokeWidth={1.8} />,
	},
	{
		id: "bg",
		label: "Background",
		icon: <Image size={15} strokeWidth={1.8} />,
	},
	{
		id: "audio",
		label: "Audio",
		icon: <Volume2 size={15} strokeWidth={1.8} />,
	},
	{
		id: "overlay",
		label: "Overlay",
		icon: <Layers size={15} strokeWidth={1.8} />,
	},
	{
		id: "annotations",
		label: "Annotate",
		icon: <PenLine size={15} strokeWidth={1.8} />,
	},
	{
		id: "edit",
		label: "Edit",
		icon: <Scissors size={15} strokeWidth={1.8} />,
	},
];

interface TabRailProps {
	activeTab: string | null;
	onSelect: (tabId: string | null) => void;
	modified?: Record<string, boolean>;
}

export default function TabRail({ activeTab, onSelect, modified = {} }: TabRailProps) {
	return (
		<div className="w-14 bg-[#0a0a11] border-l border-white/[0.06] flex flex-col items-center py-2 gap-1 flex-shrink-0">
			{TABS.map((tab) => {
				const isActive = activeTab === tab.id;
				const isModified = modified[tab.id];
				return (
					<button
						key={tab.id}
						type="button"
						title={tab.label}
						onClick={() => onSelect(isActive ? null : tab.id)}
						className={`
							w-[42px] py-2 rounded-lg border flex flex-col items-center justify-center gap-1.5
							transition-all duration-150 cursor-pointer relative
							${
								isActive
									? "border-[#34B27B]/40 bg-[#34B27B]/10 text-[#34B27B] shadow-[0_0_0_1px_rgba(52,178,123,0.15)_inset]"
									: "border-white/[0.05] bg-white/[0.02] text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
							}
						`}
					>
						{tab.icon}
						<span className="text-[8px] font-semibold tracking-wide uppercase leading-none">
							{tab.label}
						</span>
						{isModified && (
							<div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#34B27B] shadow-[0_0_5px_rgba(52,178,123,0.6)]" />
						)}
					</button>
				);
			})}
		</div>
	);
}

export type { TabDef };
export { TABS };
