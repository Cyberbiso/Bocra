import LicenseVerification from "@/components/LicenseVerification";
import Chatbot from "@/components/Chatbot";

export const metadata = {
  title: "Licence Verification | Services | BOCRA",
  description:
    "Verify the status of any BOCRA-issued licence. Search by operator name, licence number, or licence type.",
};

export default function LicenceVerificationPage() {
  return (
    <>
      <LicenseVerification />
      <Chatbot />
    </>
  );
}
