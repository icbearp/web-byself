import { loadSiteContent } from "./api/_lib/content";
import { Studio } from "./studio";

export default async function Home() {
  const content = await loadSiteContent();
  return <Studio content={content} />;
}
