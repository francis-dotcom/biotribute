import { notFound } from "next/navigation";
import { TributeBuilderForm } from "@/components/tribute-builder-form";
import { requireAdminToken } from "@/lib/admin";
import { getTributeRecord, isTributeStoreConfigured } from "@/lib/tributes-store";

type TributeBuilderPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function TributeBuilderPage({
  params,
  searchParams,
}: TributeBuilderPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  requireAdminToken(token, `/biotribute/${slug}`);

  const tribute = await getTributeRecord(slug);
  if (!tribute) {
    notFound();
  }

  const storeConfigured = isTributeStoreConfigured();

  return (
    <TributeBuilderForm tribute={tribute} storeConfigured={storeConfigured} />
  );
}
