import { useMemo } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useScopedT } from "@/contexts/I18nContext";

export interface CommandDef {
	id: string;
	label: string;
	icon?: React.ReactNode;
	category: "navigation" | "tools" | "actions" | "settings";
	shortcut?: string;
	keywords?: string[];
	onSelect: () => void;
}

interface CommandPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	commands: CommandDef[];
}

export default function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
	const t = useScopedT("commandPalette");

	const grouped = useMemo(() => {
		const groups: Record<string, CommandDef[]> = {};
		for (const cmd of commands) {
			if (!groups[cmd.category]) groups[cmd.category] = [];
			groups[cmd.category].push(cmd);
		}
		return groups;
	}, [commands]);

	const categoryKeys = useMemo(() => Object.keys(grouped), [grouped]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="overflow-hidden p-0 border-white/[0.08] bg-[#0e0e18]">
				<Command className="bg-[#0e0e18] text-slate-200 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input-wrapper]_svg]:text-slate-500 [&_[cmdk-input]]:h-11 [&_[cmdk-input]]:bg-transparent [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
					<CommandInput
						placeholder={t("placeholder")}
						className="text-sm text-slate-200 placeholder:text-slate-500"
					/>
					<CommandList className="[&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:bg-white/[0.08] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
						<CommandEmpty className="py-8 text-sm text-slate-500">{t("noResults")}</CommandEmpty>
						{categoryKeys.map((cat, index) => (
							<span key={cat}>
								{index > 0 && <CommandSeparator className="bg-white/[0.06]" />}
								<CommandGroup heading={t(`categories.${cat}`)}>
									{grouped[cat].map((cmd) => (
										<CommandItem
											key={cmd.id}
											keywords={cmd.keywords}
											onSelect={() => {
												cmd.onSelect();
												onOpenChange(false);
											}}
											className="text-slate-200 data-[selected=true]:bg-[#34B27B]/10 data-[selected=true]:text-slate-100"
										>
											{cmd.icon}
											<span>{cmd.label}</span>
											{cmd.shortcut && (
												<CommandShortcut className="text-slate-500 text-[10px] tracking-wider">
													{cmd.shortcut}
												</CommandShortcut>
											)}
										</CommandItem>
									))}
								</CommandGroup>
							</span>
						))}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}
