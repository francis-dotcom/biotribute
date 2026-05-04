import { redirect } from "next/navigation";

type ConsoleEditPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ConsoleEditPage({
  params,
}: ConsoleEditPageProps) {
  const { slug } = await params;
  redirect(`/dashboard/${slug}/edit`);
}
