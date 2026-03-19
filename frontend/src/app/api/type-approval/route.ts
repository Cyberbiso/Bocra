import { NextRequest } from "next/server";

const BOCRA_GATEWAY =
  "https://sims.bocra.org.bw/simsgateway/sims-type-approval/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") || "";
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "12";

  try {
    const res = await fetch(
      `${BOCRA_GATEWAY}/certificates/public/search?page=${page}&size=${size}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchText: query,
          certificateType: "GENERIC",
          applicationType: "TYPE_APPROVAL",
          isMigrated: true,
          status: "CERTIFICATE_ISSUED",
        }),
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch type approval data" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
