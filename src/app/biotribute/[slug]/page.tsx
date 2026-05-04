import { redirect } from "next/navigation";

type LegacyBiotributePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyBiotributePage({ params }: LegacyBiotributePageProps) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
