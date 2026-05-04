import { redirect } from "next/navigation";

type ConsoleThemePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ConsoleThemePage({
  params,
}: ConsoleThemePageProps) {
  const { slug } = await params;
  redirect(`/dashboard/${slug}/theme`);
}
