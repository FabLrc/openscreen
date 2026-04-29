import { Mic, Music, Volume2 } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface PanelAudioProps {
	hasWebcam?: boolean;
}

// TODO: connect actual audio device management once the audio capture pipeline is exposed
export default function PanelAudio(_props: PanelAudioProps) {
	const [micVolume, setMicVolume] = useState(0.8);
	const [musicVolume, setMusicVolume] = useState(0.4);

	return (
		<div className="space-y-4">
			{/* Mic source */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Mic className="w-3.5 h-3.5 text-brand" />
					<span className="text-xs font-semibold text-slate-200">Microphone</span>
				</div>
				<div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
					<div className="flex items-center justify-between mb-1.5">
						<span className="text-[10px] text-slate-400">System microphone</span>
						<span className="text-[10px] text-brand font-medium">●</span>
					</div>
					<div className="flex items-center gap-2 mb-1">
						<Volume2 className="w-3 h-3 text-slate-400" />
						<div className="flex-1">
							<Slider
								value={[micVolume]}
								onValueChange={(values) => setMicVolume(values[0])}
								min={0}
								max={1}
								step={0.01}
								size="sm"
							/>
						</div>
						<span className="text-[10px] text-slate-400 font-mono w-8 text-right">
							{Math.round(micVolume * 100)}%
						</span>
					</div>
				</div>
			</div>

			{/* Background music */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Music className="w-3.5 h-3.5 text-brand" />
					<span className="text-xs font-semibold text-slate-200">Background music</span>
				</div>
				<div className="border-1.5 border-dashed border-white/10 rounded-lg p-3 text-center cursor-pointer hover:border-white/20 transition-colors mb-2">
					<span className="text-[10px] text-slate-500">+ Add audio file</span>
				</div>
				<div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
					<div className="flex items-center justify-between mb-1">
						<span className="text-[10px] text-slate-400">Music volume</span>
						<span className="text-[10px] text-slate-400 font-mono">
							{Math.round(musicVolume * 100)}%
						</span>
					</div>
					<Slider
						value={[musicVolume]}
						onValueChange={(values) => setMusicVolume(values[0])}
						min={0}
						max={1}
						step={0.01}
						size="sm"
					/>
				</div>
			</div>
		</div>
	);
}
