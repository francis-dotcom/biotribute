import { notFound } from "next/navigation";
import { TributeBuilderForm } from "@/components/tribute-builder-form";
import { requireAdminSession } from "@/lib/admin";
import { getTributeRecord, isTributeStoreConfigured } from "@/lib/tributes-store";

type TributeBuilderPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TributeBuilderPage({
  params,
}: TributeBuilderPageProps) {
  const { slug } = await params;
  await requireAdminSession(`/dashboard/${slug}/builder`);

  const tribute = await getTributeRecord(slug);
  if (!tribute) {
    notFound();
  }

  const storeConfigured = isTributeStoreConfigured();

  return (
    <TributeBuilderForm tribute={tribute} storeConfigured={storeConfigured} />
  );
}
