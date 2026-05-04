import { redirect } from "next/navigation";

type ConsoleBuilderPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ConsoleBuilderPage({
  params,
}: ConsoleBuilderPageProps) {
  const { slug } = await params;
  redirect(`/dashboard/${slug}/builder`);
}
