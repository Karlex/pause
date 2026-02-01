import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/documents")({
	component: DocumentsPage,
});

function DocumentsPage() {
	return (
		<div className="max-w-6xl">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-[28px] font-semibold text-white tracking-[-0.03em]">
						Documents
					</h1>
					<p className="text-white/40 text-[14px] mt-1">
						Manage HR documents and files
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
					<h3 className="text-[15px] font-medium text-white mb-2">
						My Documents
					</h3>
					<p className="text-[13px] text-white/40">
						Personal files and contracts
					</p>
				</div>
				<div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
					<h3 className="text-[15px] font-medium text-white mb-2">
						Company Documents
					</h3>
					<p className="text-[13px] text-white/40">Policies and handbooks</p>
				</div>
			</div>
		</div>
	);
}
