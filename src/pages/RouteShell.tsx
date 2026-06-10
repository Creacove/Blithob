import { PageHeader } from "../components/PageHeader";

export function RouteShell({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return <PageHeader title={title} description={description} />;
}
