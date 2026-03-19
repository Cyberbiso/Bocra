import DomainRegistration from "@/components/DomainRegistration";
import Chatbot from "@/components/Chatbot";

export const metadata = {
  title: "Register .bw Domain | Services | BOCRA",
  description:
    "Register and manage .bw domain names through the official BOCRA registry.",
};

export default function DomainRegistrationPage() {
  return (
    <>
      <DomainRegistration />
      <Chatbot />
    </>
  );
}
