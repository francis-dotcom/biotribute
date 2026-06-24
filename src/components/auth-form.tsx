"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthFormProps = {
  mode: "signup" | "login";
  nextPath: string;
};

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const supabase = getSupabaseBrowserClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setPending(false);
        return;
      }

      if (data.session) {
        router.push(nextPath);
        return;
      }

      setNotice("Check your email to confirm your account, then log in.");
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

    router.push(nextPath);
  }

  return (
    <form className="bt-auth-form" onSubmit={handleSubmit}>
      <h2>{mode === "signup" ? "Create your account" : "Sign in"}</h2>
      {error ? <p className="bt-auth-status">{error}</p> : null}
      {notice ? <p className="bt-auth-status">{notice}</p> : null}
      <label>
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />
      </label>
      <label>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
        />
      </label>
      <button className="bt-auth-submit" type="submit" disabled={pending}>
        {pending ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
      </button>
    </form>
  );
}
