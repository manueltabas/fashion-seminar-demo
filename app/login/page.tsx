import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="page narrow">
      <div className="card">
        <h1 className="card-title">Sign in</h1>
        <p className="muted">
          Enter the shared password to access the tool.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
