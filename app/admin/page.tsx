import type { Metadata } from "next";
import { AdminConsole } from "./admin-console";
import "./admin.css";

export const metadata: Metadata = {
  title: "内容后台 | 周多福",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
