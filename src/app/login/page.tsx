import { redirect } from "next/navigation";
import { loginAction } from "@/features/auth/actions/auth-actions";
import { AuthForm } from "@/features/auth/components/auth-form";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <AuthShell>
      <AuthForm
        action={loginAction}
        buttonLabel="Login"
        error={params.error}
        footerHref="/signup"
        footerLabel="Create account"
        footerText="New to Dogecoin?"
        mode="login"
        subtitle="Welcome back. Login to access your level dashboard."
        title="Login"
      />
    </AuthShell>
  );
}
