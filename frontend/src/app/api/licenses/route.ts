import { NextRequest, NextResponse } from "next/server";

const BOCRA_API =
  "https://customerportal.bocra.org.bw/OnlineLicenseVerificationAPI/api/LicenseDetails";
const AGENCY_ID = "8";

// ---------------------------------------------------------------------------
// Mock fallback data
// ---------------------------------------------------------------------------

const MOCK_LICENCE_TYPES = [
  { id: 1, name: "Individual Service Provider (ISP)" },
  { id: 2, name: "Network Service Provider (NSP)" },
  { id: 3, name: "Postal Service Licence" },
  { id: 4, name: "Broadcasting Licence" },
  { id: 5, name: "Type Approval Certificate" },
  { id: 6, name: "Spectrum Usage Licence" },
];

const MOCK_LICENCE_RECORDS = {
  totalCount: 3,
  pageNumber: 1,
  pageSize: 10,
  data: [
    {
      licenceNumber: "BOCRA/ISP/2022/001",
      licenceType: "Individual Service Provider (ISP)",
      clientName: "Mascom Wireless (Pty) Ltd",
      status: "Active",
      issueDate: "2022-01-15",
      expiryDate: "2027-01-14",
    },
    {
      licenceNumber: "BOCRA/NSP/2021/004",
      licenceType: "Network Service Provider (NSP)",
      clientName: "Orange Botswana (Pty) Ltd",
      status: "Active",
      issueDate: "2021-06-01",
      expiryDate: "2026-05-31",
    },
    {
      licenceNumber: "BOCRA/ISP/2020/017",
      licenceType: "Individual Service Provider (ISP)",
      clientName: "Botswana Telecommunications Corporation Ltd",
      status: "Active",
      issueDate: "2020-03-10",
      expiryDate: "2025-03-09",
    },
  ],
};

const MOCK_CUSTOMERS = [
  { clientId: 1, clientName: "Mascom Wireless (Pty) Ltd" },
  { clientId: 2, clientName: "Orange Botswana (Pty) Ltd" },
  { clientId: 3, clientName: "Botswana Telecommunications Corporation Ltd" },
  { clientId: 4, clientName: "Botswana Fibre Networks (Pty) Ltd" },
  { clientId: 5, clientName: "Liquid Telecommunications Botswana" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cacheHeaders(maxAge: number) {
  return {
    "Cache-Control": `s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  // --- Licence types (GET /GetLicenseType) ---
  if (action === "types") {
    try {
      const res = await fetch(
        `${BOCRA_API}/GetLicenseType?agencyid=${AGENCY_ID}`,
        { signal: AbortSignal.timeout(8_000) },
      );
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const data = await res.json();
      return NextResponse.json(data, { headers: cacheHeaders(1800) });
    } catch (err) {
      console.warn("[licenses] GetLicenseType fallback to mock:", err);
      return NextResponse.json(MOCK_LICENCE_TYPES, {
        headers: cacheHeaders(1800),
      });
    }
  }

  // --- Licence records (POST /GetLicenseDetails) ---
  if (action === "search") {
    const clientId = searchParams.get("clientId") || "0";
    const licenseNumber = searchParams.get("licenseNumber") || "All";
    const licenseType = searchParams.get("licenseType") || "All";
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "10";

    try {
      const body = new URLSearchParams({
        clientId,
        licenseNumber,
        licenseType,
        make: "-1",
        model: "-1",
        AgencyID: AGENCY_ID,
        PageNumber: page,
        PageSize: pageSize,
      });

      const res = await fetch(`${BOCRA_API}/GetLicenseDetails`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const data = await res.json();
      return NextResponse.json(data, { headers: cacheHeaders(300) });
    } catch (err) {
      console.warn("[licenses] GetLicenseDetails fallback to mock:", err);
      return NextResponse.json(MOCK_LICENCE_RECORDS, {
        headers: cacheHeaders(300),
      });
    }
  }

  // --- Customer autocomplete (POST /SearchCustomer) ---
  if (action === "customers") {
    const name = searchParams.get("name") || "";
    if (name.length < 1) {
      return NextResponse.json([]);
    }

    try {
      const body = new URLSearchParams({ name, agencyID: AGENCY_ID });

      const res = await fetch(`${BOCRA_API}/SearchCustomer`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const data = await res.json();
      return NextResponse.json(data, { headers: cacheHeaders(1800) });
    } catch (err) {
      console.warn("[licenses] SearchCustomer fallback to mock:", err);
      const lower = name.toLowerCase();
      const filtered = MOCK_CUSTOMERS.filter((c) =>
        c.clientName.toLowerCase().includes(lower),
      );
      return NextResponse.json(filtered, { headers: cacheHeaders(1800) });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
