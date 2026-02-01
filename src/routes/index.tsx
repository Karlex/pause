import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useId, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Dashboard } from "@/components/dashboard";
import { Logo } from "@/components/Logo";
import { Button, Input } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: IndexPage,
});

function IndexPage() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <LoadingState />;
	}

	if (session?.user) {
		return (
			<DashboardLayout>
				<Dashboard user={session.user} />
			</DashboardLayout>
		);
	}

	return <LoginPage />;
}

function LoadingState() {
	return (
		<div className="min-h-screen bg-primary flex items-center justify-center">
			<motion.div
				className="w-6 h-6 rounded-full border border-fg-tertiary border-t-fg-primary"
				animate={{ rotate: 360 }}
				transition={{
					duration: 1,
					repeat: Infinity,
					ease: "linear",
				}}
			/>
		</div>
	);
}

function LoginPage() {
	const [magicLinkSent, setMagicLinkSent] = useState(false);
	const [magicLinkEmail, setMagicLinkEmail] = useState("");

	if (magicLinkSent) {
		return (
			<MagicLinkSuccess
				email={magicLinkEmail}
				onReset={() => setMagicLinkSent(false)}
			/>
		);
	}

	return (
		<div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				className="w-full max-w-[340px]"
			>
				<div className="flex flex-col items-center mb-8">
					<Logo size="md" />
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.15, duration: 0.4 }}
						className="mt-3 text-[15px] font-medium text-fg-primary tracking-[-0.01em]"
					>
						Pause
					</motion.span>
				</div>

				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
					className="bg-elevated rounded-2xl p-6 shadow-lg border border-separator"
				>
					<LoginForm
						onMagicLinkSent={(email) => {
							setMagicLinkEmail(email);
							setMagicLinkSent(true);
						}}
					/>
				</motion.div>
			</motion.div>
		</div>
	);
}

function LoginForm({
	onMagicLinkSent,
}: {
	onMagicLinkSent: (email: string) => void;
}) {
	const emailId = useId();
	const passwordId = useId();
	const [isLoading, setIsLoading] = useState(false);
	const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setIsLoading(true);
			const result = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			});
			setIsLoading(false);

			if (!result.error) {
				window.location.reload();
			}
		},
	});

	const handleMagicLink = async () => {
		const email = form.getFieldValue("email");
		if (!email) return;

		setIsMagicLinkLoading(true);
		const result = await authClient.signIn.magicLink({
			email,
			callbackURL: "/",
		});
		setIsMagicLinkLoading(false);

		if (!result.error) {
			onMagicLinkSent(email);
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="space-y-4"
		>
			<form.Field name="email">
				{(field) => (
					<Input
						id={emailId}
						label="Email"
						type="email"
						value={field.state.value}
						onChange={(e) => field.handleChange(e.target.value)}
						onBlur={field.handleBlur}
						required
						autoComplete="email"
						placeholder="name@company.com"
					/>
				)}
			</form.Field>

			<form.Field name="password">
				{(field) => (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<label
								htmlFor={passwordId}
								className="block text-[13px] font-medium text-fg-secondary"
							>
								Password
							</label>
							<motion.button
								type="button"
								whileHover={{ scale: 1.02 }}
								className="text-[12px] text-fg-tertiary hover:text-fg-secondary transition-colors"
							>
								Forgot?
							</motion.button>
						</div>
						<Input
							id={passwordId}
							type="password"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							required
							autoComplete="current-password"
							placeholder="••••••••"
						/>
					</div>
				)}
			</form.Field>

			<div className="pt-1">
				<Button type="submit" isLoading={isLoading}>
					Sign in
				</Button>
			</div>

			<div className="flex items-center justify-center py-1">
				<span className="text-[13px] text-fg-tertiary">or</span>
			</div>

			<Button
				type="button"
				variant="secondary"
				isLoading={isMagicLinkLoading}
				onClick={handleMagicLink}
			>
				Continue with Magic Link
			</Button>
		</form>
	);
}

function MagicLinkSuccess({
	email,
	onReset,
}: {
	email: string;
	onReset: () => void;
}) {
	return (
		<div className="min-h-screen bg-primary flex items-center justify-center p-6">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				className="w-full max-w-[340px] text-center"
			>
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{
						delay: 0.2,
						type: "spring",
						stiffness: 300,
						damping: 20,
					}}
					className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-5"
				>
					<svg
						className="w-6 h-6 text-accent"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={1.5}
					>
						<title>Success</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3, duration: 0.4 }}
				>
					<h1 className="text-xl font-medium text-fg-primary tracking-[-0.01em] mb-2">
						Check your email
					</h1>
					<p className="text-fg-secondary text-[15px] mb-1">
						We sent a sign-in link to
					</p>
					<p className="text-fg-primary font-medium text-[15px] mb-6">
						{email}
					</p>

					<Button variant="ghost" onClick={onReset}>
						Use a different email
					</Button>
				</motion.div>
			</motion.div>
		</div>
	);
}
