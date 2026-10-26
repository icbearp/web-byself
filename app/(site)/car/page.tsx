import { redirect } from "next/navigation";

// 汽车与金融栏目已下线，旧链接统一回到首页。
export default function CarPage() {
  redirect("/");
}
