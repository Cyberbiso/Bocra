import LicenseVerification from "@/components/LicenseVerification";

export const metadata = {
  title: "Licence Verification | Services | BOCRA",
  description:
    "Verify the status of any BOCRA-issued licence. Search by operator name, licence number, or licence type.",
};

export default function LicenceVerificationPage() {
  return <LicenseVerification />;
}
