import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";
import { CountryStats } from "./CountryStats";
import { useCountryData } from "../../hooks/useCountryData";

interface Props {
	code: string | null;
}

function Skeleton({ className }: { className?: string }) {
	return <div className={cn("animate-pulse rounded bg-gray-500", className)} />;
}

export function CountryPanel({ code }: Props) {
	const { data, isLoading, isError } = useCountryData(code);
	const popoverRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const popover = popoverRef.current;
		if (!popover) return;

		if (code && !popover.matches(":popover-open")) {
			popover.showPopover();
		}
	}, [code]);

	const handleClose = () => {
		popoverRef.current?.hidePopover();
	};

	return (
		<div
			ref={popoverRef}
			popover="manual"
			className={cn(
				"m-0 border-0 p-0",
				":popover-open[flex] flex-col",
				"bg-white/10 border border-white/10 backdrop-blur-xl",
				"shadow-2xl overflow-y-auto",
				"sm:top-4 sm:right-4 sm:bottom-4 sm:w-80 sm:rounded-2xl",
				"fixed bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl sm:max-h-none sm:fixed",
				"transition-transform duration-300 ease-out"
			)}
		>
			{/* Close button */}
			<button
				onClick={handleClose}
				className="absolute top-2 right-2 z-30 w-8 h-8 flex items-center justify-center text-xl text-gray-300 hover:text-white bg-white/10 hover:bg-white/30 rounded-full transition-colors"
				aria-label="Close panel"
			>
				✕
			</button>

			<div className="p-5 pt-12">
				{isLoading && (
					<div className="space-y-3">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-6 w-2/3" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				)}

				{isError && (
					<div className="space-y-2">
						<p className="text-sm text-red-400">
							Failed to load country data.
						</p>
					</div>
				)}

				{data && (
					<>
						<img
							src={data.flags.svg}
							alt={data.flags.alt ?? `Flag of ${data.name.common}`}
							className="w-full aspect-9/6 object-cover rounded-lg mb-4"
						/>
						<h2 className="text-lg font-semibold text-white">
							{data.name.common}
						</h2>
						<p className="text-xs text-white">{data.name.official}</p>
						<CountryStats country={data} />
					</>
				)}
			</div>
		</div>
	);
}
