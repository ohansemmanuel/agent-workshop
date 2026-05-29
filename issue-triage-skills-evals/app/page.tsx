import { Chat } from "@/components/Chat";
import { CONTEXT_STATS } from "@/lib/triage/context";

// Server Component: we read the assembled-context stats here (server-side, where
// the giant system prompt lives) and pass just the numbers to the client Chat.
// The ~13k-token prompt itself never ships to the browser.
export default function Home() {
  return <Chat stats={CONTEXT_STATS} />;
}
