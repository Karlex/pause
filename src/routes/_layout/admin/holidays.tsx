import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/admin/holidays")({
	component: HolidaysPage,
});

function HolidaysPage() {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold text-fg-primary">
					Public Holidays
				</h2>
				<p className="text-sm text-fg-secondary mt-1">
					Manage public holidays for different regions
				</p>
			</div>

			<div className="bg-surface-elevated rounded-lg border border-separator p-12 text-center">
				<p className="text-fg-muted">
					Public Holidays management coming soon...
				</p>
			</div>
		</div>
	);
}
