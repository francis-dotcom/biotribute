"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type NewTributeFormProps = {
  ownerUserId?: string;
};

export function NewTributeForm({ ownerUserId }: NewTributeFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [years, setYears] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalSlug = slugify(slug || name);
    if (!finalSlug) {
      setError("Please enter a name or a custom URL.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/tributes/${finalSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: finalSlug,
          ownerUserId,
          name: name.trim(),
          years: years.trim() || "—",
          tagline: "A life remembered.",
          organizer: "Family",
          theme: "ivory",
          galleryNote: "No photos have been added yet.",
          lifeStory: "Add this person's story in the builder after creating the tribute.",
          isPublic: false,
          timeline: [],
          contributors: [],
          supportAmounts: [],
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Unable to create tribute.");
        setPending(false);
        return;
      }

      router.push(`/console/${finalSlug}`);
    } catch {
      setError("Unable to create tribute. Please try again.");
      setPending(false);
    }
  }

  return (
    <form className="form-card login-card" onSubmit={handleSubmit}>
      <h2>New tribute details</h2>
      {error ? <p className="form-status">{error}</p> : null}
      <label className="field-block">
        <span>Name</span>
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) {
              setSlug(slugify(event.target.value));
            }
          }}
          required
          autoFocus
        />
      </label>
      <label className="field-block">
        <span>Years (e.g. 1965 - 2024)</span>
        <input value={years} onChange={(event) => setYears(event.target.value)} />
      </label>
      <label className="field-block">
        <span>Page URL (/{slug || "your-tribute-url"})</span>
        <input
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
          placeholder="auto-generated from name"
        />
      </label>
      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create Tribute"}
      </button>
    </form>
  );
}
