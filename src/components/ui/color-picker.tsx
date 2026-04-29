import { hexToHsva, hsvaToHex, hsvaToRgba } from "@uiw/react-color";
import Hue from "@uiw/react-color-hue";
import Saturation from "@uiw/react-color-saturation";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ColorPickerProps {
	value: string;
	presets?: string[];
	onChange: (color: string) => void;
	className?: string;
}

export function ColorPicker({ value, presets = [], onChange, className }: ColorPickerProps) {
	const [hsva, setHsva] = useState(() => hexToHsva(value));

	const handleChange = (newColor: { h?: number; s?: number; v?: number; a?: number }) => {
		const merged = { ...hsva, ...newColor };
		setHsva(merged);
		onChange(hsvaToHex(merged));
	};

	const currentHex = hsvaToHex(hsva);
	const rgba = hsvaToRgba(hsva);

	return (
		<div className={cn("space-y-3", className)}>
			<div className="rounded-lg overflow-hidden">
				<Saturation
					hue={hsva.h}
					hsva={hsva}
					onChange={(color) => handleChange(color)}
					radius="8px"
					style={{ width: "100%", height: 160 }}
				/>
			</div>

			<Hue
				hue={hsva.h}
				onChange={(color) => handleChange({ h: color.h })}
				direction="horizontal"
				style={{ width: "100%", height: 12 }}
			/>

			{presets.length > 0 && (
				<div>
					<span className="text-[10px] font-medium text-slate-500 mb-1.5 block uppercase tracking-wider">
						Presets
					</span>
					<div className="grid grid-cols-8 gap-1.5">
						{presets.map((c) => {
							const presetHex = hsvaToHex(hexToHsva(c));
							return (
								<div
									key={c}
									className={cn(
										"aspect-square w-7 h-7 rounded-md border-2 cursor-pointer transition-all duration-200",
										currentHex.toLowerCase() === presetHex.toLowerCase()
											? "border-[#34B27B] ring-1 ring-[#34B27B]/30"
											: "border-white/10 hover:border-[#34B27B]/40",
									)}
									style={{ background: c }}
									onClick={() => {
										const newHsva = hexToHsva(c);
										setHsva(newHsva);
										onChange(hsvaToHex(newHsva));
									}}
									role="button"
								/>
							);
						})}
					</div>
				</div>
			)}

			<div className="flex items-center gap-2">
				<div
					className="w-8 h-8 rounded-md border border-white/10 shrink-0"
					style={{ background: currentHex }}
				/>
				<div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-black/20 border border-white/10">
					<span className="text-[10px] text-slate-500 font-mono">#</span>
					<input
						value={currentHex.replace("#", "")}
						onChange={(e) => {
							const input = e.target.value;
							const cleaned = `#${input}`;
							if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
								const newHsva = hexToHsva(cleaned);
								setHsva(newHsva);
								onChange(cleaned);
							}
						}}
						className="flex-1 bg-transparent text-xs text-slate-200 font-mono outline-none placeholder:text-slate-600"
						placeholder="000000"
						maxLength={6}
					/>
				</div>
				<div className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-black/20 border border-white/10">
					<span className="text-[9px] text-slate-500 font-mono">RGBA</span>
					<span className="text-[10px] text-slate-300 font-mono tabular-nums">
						{Math.round(rgba.r)},{Math.round(rgba.g)},{Math.round(rgba.b)}
					</span>
				</div>
			</div>
		</div>
	);
}
