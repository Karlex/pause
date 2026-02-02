import { CaretRight, FileText } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useState } from "react";

interface Policy {
	id: string;
	title: string;
	category: string;
	content: string;
	lastUpdated: string;
}

// Sample company policies - in production, these would come from the database
const COMPANY_POLICIES: Policy[] = [
	{
		id: "1",
		title: "Annual Leave Policy",
		category: "Leave",
		content: `## Annual Leave Policy

### Entitlement
All full-time employees are entitled to 20 days of annual leave per year, plus bank holidays.

### Booking Leave
- Submit requests at least 2 weeks in advance
- Use the Time Off section to book
- Manager approval required

### Carry Over
- Up to 5 days can be carried over to the next year
- Must be used by end of Q1

### Part-Time Employees
Pro-rata entitlement based on working days.`,
		lastUpdated: "2026-01-15",
	},
	{
		id: "2",
		title: "Sick Leave Policy",
		category: "Leave",
		content: `## Sick Leave Policy

### Reporting Sickness
- Notify your manager as soon as possible
- For absences over 3 days, provide a doctor's note
- Record sick leave in the system

### Sick Pay
- Full pay for first 5 days
- Statutory sick pay thereafter
- Doctor's note required after day 3

### Return to Work
- Return to work interview may be required
- Update your status in the system`,
		lastUpdated: "2026-01-10",
	},
	{
		id: "3",
		title: "Remote Work Policy",
		category: "Working Arrangements",
		content: `## Remote Work Policy

### Eligibility
All employees are eligible for remote work arrangements, subject to role requirements and manager approval.

### Core Hours
- Available 10:00 - 16:00 UK time
- Respond to messages within 2 hours during core hours

### Equipment
- Company provides laptop and necessary equipment
- Ensure secure internet connection
- Maintain confidentiality of company data

### Communication
- Daily standup attendance required
- Use Slack for team communication
- Calendar should reflect your working hours`,
		lastUpdated: "2026-02-01",
	},
	{
		id: "4",
		title: "Code of Conduct",
		category: "General",
		content: `## Code of Conduct

### Professional Standards
- Treat all colleagues with respect
- Maintain confidentiality
- Avoid conflicts of interest

### Workplace Behavior
- Zero tolerance for harassment or discrimination
- Report concerns to HR or your manager
- Support inclusive environment

### Social Media
- Be mindful when posting about work
- Don't share confidential information
- Views expressed are personal, not company`,
		lastUpdated: "2026-01-01",
	},
];

const CATEGORIES = ["All", "Leave", "Working Arrangements", "General"];

export function CompanyPolicies() {
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

	const filteredPolicies =
		selectedCategory === "All"
			? COMPANY_POLICIES
			: COMPANY_POLICIES.filter((p) => p.category === selectedCategory);

	if (selectedPolicy) {
		return (
			<PolicyViewer
				policy={selectedPolicy}
				onBack={() => setSelectedPolicy(null)}
			/>
		);
	}

	return (
		<div className="max-w-5xl">
			{/* Header */}
			<div className="mb-10">
				<h1 className="text-[24px] font-medium text-white tracking-[-0.02em]">
					Company Policies
				</h1>
				<p className="text-[14px] text-white/40 mt-2">
					Read and understand our company policies and procedures
				</p>
			</div>

			{/* Category Filter */}
			<div className="flex items-center gap-2 mb-8 pb-6 border-b border-white/[0.04]">
				{CATEGORIES.map((category) => (
					<button
						type="button"
						key={category}
						onClick={() => setSelectedCategory(category)}
						className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
							selectedCategory === category
								? "bg-white/10 text-white/90"
								: "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
						}`}
					>
						{category}
					</button>
				))}
			</div>

			{/* Policies List */}
			<div className="space-y-[1px]">
				{filteredPolicies.map((policy) => (
					<motion.div
						key={policy.id}
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.25,
							ease: [0.22, 1, 0.36, 1],
						}}
						onClick={() => setSelectedPolicy(policy)}
						className="group flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
					>
						<div className="flex items-center gap-4">
							<div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center">
								<FileText className="w-4 h-4 text-white/40" />
							</div>
							<div className="flex flex-col">
								<span className="text-[14px] text-white/90 group-hover:text-white transition-colors">
									{policy.title}
								</span>
								<span className="text-[13px] text-white/40">
									{policy.category} • Updated {policy.lastUpdated}
								</span>
							</div>
						</div>
						<CaretRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
					</motion.div>
				))}
			</div>
		</div>
	);
}

interface PolicyViewerProps {
	policy: Policy;
	onBack: () => void;
}

function PolicyViewer({ policy, onBack }: PolicyViewerProps) {
	return (
		<div className="max-w-3xl">
			{/* Back Button */}
			<button
				type="button"
				onClick={onBack}
				className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors mb-6"
			>
				<svg
					className="w-4 h-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-label="Back"
				>
					<title>Back</title>
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
				Back to policies
			</button>

			{/* Policy Content */}
			<div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-8">
				<div className="mb-6 pb-6 border-b border-white/[0.06]">
					<span className="text-[12px] text-white/40 uppercase tracking-wider">
						{policy.category}
					</span>
					<h1 className="text-[22px] font-medium text-white mt-2">
						{policy.title}
					</h1>
					<p className="text-[13px] text-white/40 mt-1">
						Last updated: {policy.lastUpdated}
					</p>
				</div>

				<div className="prose prose-invert prose-sm max-w-none">
					<PolicyContent content={policy.content} />
				</div>
			</div>
		</div>
	);
}

// Simple markdown-like renderer for policy content
function PolicyContent({ content }: { content: string }) {
	const lines = content.split("\n");

	return (
		<div className="space-y-4">
			{lines.map((line, lineIndex) => {
				const trimmed = line.trim();

				if (trimmed.startsWith("## ")) {
					return (
						<h2
							key={`h2-${lineIndex}`}
							className="text-[18px] font-medium text-white mt-8 mb-4"
						>
							{trimmed.replace("## ", "")}
						</h2>
					);
				}

				if (trimmed.startsWith("### ")) {
					return (
						<h3
							key={`h3-${lineIndex}`}
							className="text-[15px] font-medium text-white/90 mt-6 mb-3"
						>
							{trimmed.replace("### ", "")}
						</h3>
					);
				}

				if (trimmed.startsWith("- ")) {
					return (
						<li
							key={`li-${lineIndex}`}
							className="text-[14px] text-white/70 ml-4"
						>
							{trimmed.replace("- ", "")}
						</li>
					);
				}

				if (trimmed === "") {
					return <div key={`spacer-${lineIndex}`} className="h-2" />;
				}

				return (
					<p
						key={`p-${lineIndex}`}
						className="text-[14px] text-white/70 leading-relaxed"
					>
						{trimmed}
					</p>
				);
			})}
		</div>
	);
}
