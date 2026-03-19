import TypeApproval from "@/components/TypeApproval";
import Chatbot from "@/components/Chatbot";

export const metadata = {
  title: "Type Approval Certificates | Services | BOCRA",
  description:
    "Search the official BOCRA registry of type-approved devices certified for use in Botswana.",
};

export default function TypeApprovalPage() {
  return (
    <>
      <TypeApproval />
      <Chatbot />
    </>
  );
}
