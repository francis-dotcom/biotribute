import { redirect } from "next/navigation";

type LegacyTributePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyTributePage({ params }: LegacyTributePageProps) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
