import { redirect } from "next/navigation";

// “关于”已经并入首页的个人介绍与经历，旧链接回到首页。
export default function AboutPage() {
  redirect("/#journey");
}
