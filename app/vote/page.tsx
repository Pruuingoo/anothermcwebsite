import VotePage, { getVotePageTitle } from "@/lib/vote-page";

export const metadata = { title: getVotePageTitle("/") };

export default function VotingHomePage() {
  return <VotePage route="/" />;
}
