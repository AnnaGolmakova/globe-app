import { cn } from "../../utils/cn";
import { CountryStats } from "./CountryStats";
import { useCountryData } from "../../hooks/useCountryData";

interface Props {
	code: string | null;
	onClose: () => void;
}

function Skeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn("animate-pulse rounded bg-[var(--color-surface)]", className)}
		/>
	);
}

export function CountryPanel({ code, onClose }: Props) {
	const { data, isLoading, isError, error } = useCountryData(code);

	const isOpen = !!code;

	// Log errors for debugging
	if (isError && error) {
		console.error("Country data fetch error:", error);
	}

	return (
		<>
			{/* Backdrop — close on click */}
			{isOpen && (
				<div className="absolute inset-0 z-10" onClick={onClose} aria-hidden />
			)}

			{/* Panel */}
			<aside
				className={cn(
					"absolute z-20 flex flex-col",
					"bg-[var(--color-surface)] border border-white/10",
					"shadow-2xl overflow-y-auto",
					// Desktop: right side panel
					"sm:top-4 sm:right-4 sm:bottom-4 sm:w-80 sm:rounded-2xl",
					// Mobile: bottom sheet
					"bottom-0 left-0 right-0 max-h-[60vh] rounded-t-2xl sm:max-h-none",
					"transition-transform duration-300 ease-out",
					isOpen
						? "translate-y-0 sm:translate-x-0"
						: "translate-y-full sm:translate-x-[120%]"
				)}
				aria-label="Country information"
			>
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-2 right-2 z-30 w-8 h-8 flex items-center justify-center text-xl text-[var(--color-text)] hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors"
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
							<p className="text-xs text-[var(--color-muted)]">
								Code: {code}
							</p>
							{error instanceof Error && (
								<p className="text-xs text-[var(--color-muted)]">
									{error.message}
								</p>
							)}
						</div>
					)}

					{data && (
						<>
							<img
								src={data.flags.svg}
								alt={data.flags.alt ?? `Flag of ${data.name.common}`}
								className="w-full h-20 object-cover rounded-lg mb-4"
							/>
							<h2 className="text-lg font-semibold text-[var(--color-text)]">
								{data.name.common}
							</h2>
							<p className="text-xs text-[var(--color-muted)]">
								{data.name.official}
							</p>
							<CountryStats country={data} />
						</>
					)}
				</div>
			</aside>
		</>
	);
}
