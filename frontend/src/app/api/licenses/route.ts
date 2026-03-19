import { NextRequest } from "next/server";

const BOCRA_API =
  "https://customerportal.bocra.org.bw/OnlineLicenseVerificationAPI/api/LicenseDetails";
const AGENCY_ID = "8";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  try {
    if (action === "search") {
      const clientId = searchParams.get("clientId") || "0";
      const licenseNumber = searchParams.get("licenseNumber") || "All";
      const licenseType = searchParams.get("licenseType") || "All";
      const page = searchParams.get("page") || "1";
      const pageSize = searchParams.get("pageSize") || "10";

      const params = new URLSearchParams({
        clientId,
        licenseNumber: licenseNumber || "All",
        licenseType,
        make: "-1",
        model: "-1",
        AgencyID: AGENCY_ID,
        PageNumber: page,
        PageSize: pageSize,
      });

      const res = await fetch(`${BOCRA_API}/GetLicenseDetails?${params}`);
      if (!res.ok) {
        return Response.json(
          { error: "Failed to fetch license details" },
          { status: res.status }
        );
      }
      const data = await res.json();
      return Response.json(data);
    }

    if (action === "types") {
      const res = await fetch(
        `${BOCRA_API}/GetLicenseType?agencyid=${AGENCY_ID}`
      );
      if (!res.ok) {
        return Response.json(
          { error: "Failed to fetch license types" },
          { status: res.status }
        );
      }
      const data = await res.json();
      return Response.json(data);
    }

    if (action === "customers") {
      const name = searchParams.get("name") || "";
      if (name.length < 1) {
        return Response.json([]);
      }
      const params = new URLSearchParams({
        name,
        agencyID: AGENCY_ID,
      });
      const res = await fetch(`${BOCRA_API}/SearchCustomer?${params}`);
      if (!res.ok) {
        return Response.json(
          { error: "Failed to search customers" },
          { status: res.status }
        );
      }
      const data = await res.json();
      return Response.json(data);
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
