import {
  LayoutGrid,
  Folder,
  Sparkles,
  FileSearch,
  MessageCircleQuestion,
  BookOpen,
  Bell,
  User,
  IndianRupee,
} from "lucide-react";
import type { NavItem } from "@/layouts/DashboardLayout";

export const lawyerNav: NavItem[] = [
  { to: "/lawyer", label: "Home", icon: LayoutGrid },
  { to: "/lawyer/cases", label: "My Cases", icon: Folder },
  { to: "/lawyer/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/lawyer/notifications", label: "Notifications", icon: Bell },
  { to: "/lawyer/profile", label: "My Profile", icon: User },
  { to: "/lawyer/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  {
    to: "/lawyer/ai-assistant",
    label: "Counter Generator",
    icon: Sparkles,
    section: "AI Features",
  },
  { to: "/lawyer/summarizer", label: "Case Summarizer", icon: FileSearch, section: "AI Features" },
  {
    to: "/lawyer/qa-assistant",
    label: "Case Q&A",
    icon: MessageCircleQuestion,
    section: "AI Features",
  },
];
