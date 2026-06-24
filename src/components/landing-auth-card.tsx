"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type LandingAuthCardProps = {
  initialMode: "signup" | "login";
  isConfigured: boolean;
};

export function LandingAuthCard({ initialMode, isConfigured }: LandingAuthCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function switchMode(nextMode: "signup" | "login") {
    setMode(nextMode);
    setStatus(null);
    setError(null);
    window.history.replaceState(null, "", `/?auth=${nextMode}#create-account`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (!isConfigured) {
      setError("Account access is not configured yet.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const supabase = getSupabaseBrowserClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setPending(false);
        return;
      }

      if (data.session) {
        router.push("/console/new");
        return;
      }

      setStatus("Check your email to confirm your account, then sign in.");
      setPending(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setPending(false);
      return;
    }

    router.push("/console");
  }

  const isSignup = mode === "signup";

  return (
    <form className="bt-signup-card" onSubmit={handleSubmit}>
      <h2>{isSignup ? "Create your BioTribute account" : "Sign in to BioTribute"}</h2>
      <p className="bt-muted">
        {isSignup
          ? "It's free to start. No credit card required."
          : "Manage your tribute pages and family memories."}
      </p>
      {error ? <p className="bt-landing-auth-status">{error}</p> : null}
      {status ? <p className="bt-landing-auth-status">{status}</p> : null}
      {isSignup ? (
        <label>
          Full name
          <input
            autoComplete="name"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jane Doe"
            required
            value={fullName}
          />
        </label>
      ) : null}
      <label>
        Email
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="jane@email.com"
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        Password
        <input
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
      </label>
      {isSignup ? (
        <label>
          Confirm password
          <input
            autoComplete="new-password"
            minLength={6}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={confirmPassword}
          />
        </label>
      ) : null}
      <button className="bt-btn bt-btn-primary bt-full" disabled={pending} type="submit">
        {pending ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
      </button>
      <p className="bt-signin">
        {isSignup ? "Already have an account? " : "Need an account? "}
        <button
          className="bt-auth-inline-button"
          onClick={() => switchMode(isSignup ? "login" : "signup")}
          type="button"
        >
          {isSignup ? "Sign in" : "Create one"}
        </button>
      </p>
    </form>
  );
}
