import { redirect } from "next/navigation";
import { signupAction } from "@/features/auth/actions/auth-actions";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <AuthShell>
      <AuthForm
        action={signupAction}
        buttonLabel="Create Account"
        error={params.error}
        footerHref="/login"
        footerLabel="Login"
        footerText="Already have an account?"
        mode="signup"
        subtitle="Create your account to unlock the commission dashboard."
        title="Sign Up"
      />
    </AuthShell>
  );
}
