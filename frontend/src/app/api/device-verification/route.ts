import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImeiStatus =
  | 'VERIFIED'
  | 'FAILED_VERIFICATION'
  | 'DUPLICATE'
  | 'NOT_FOUND'
  | 'BLOCKED'
  | 'BLACKLISTED'

export interface VerificationResult {
  imei: string
  status: ImeiStatus
  brand?: string
  model?: string
  typeApprovalNumber?: string
  remarks?: string
  checkedAt: string
}

// ─── Mock device database (keyed by IMEI 3rd digit when prefix = "35") ────────

const BRAND_MODELS: Record<string, { brand: string; models: string[] }> = {
  '0': { brand: 'Samsung',  models: ['Galaxy A55 5G', 'Galaxy A35', 'Galaxy A15'] },
  '1': { brand: 'Apple',    models: ['iPhone 15 Pro', 'iPhone 15', 'iPhone 14'] },
  '2': { brand: 'Huawei',   models: ['P60 Pro', 'Nova 12 SE', 'Y9s'] },
  '3': { brand: 'Xiaomi',   models: ['Redmi Note 13 Pro', 'Poco X6', '14T'] },
  '4': { brand: 'Nokia',    models: ['G42 5G', 'C32', 'XR21'] },
  '5': { brand: 'Oppo',     models: ['Reno 11 F', 'A79 5G', 'Find X7'] },
  '6': { brand: 'Tecno',    models: ['Spark 20 Pro', 'Camon 30', 'Phantom V Flip'] },
  '7': { brand: 'Infinix',  models: ['Hot 40 Pro', 'Note 40 Pro', 'Zero 40 5G'] },
  '8': { brand: 'Motorola', models: ['Moto G85', 'Edge 50 Pro', 'G54 5G'] },
  '9': { brand: 'Itel',     models: ['A70', 'P55 5G', 'Vision 3 Plus'] },
}

function pickDevice(imei: string): { brand: string; model: string; typeApprovalNumber: string } {
  const digit3 = imei[2]
  const digit4 = parseInt(imei[3] ?? '0', 10)
  const entry  = BRAND_MODELS[digit3] ?? BRAND_MODELS['0']
  const model  = entry.models[digit4 % entry.models.length]
  const taNum  = `TA-${2020 + (digit4 % 5)}-${String(parseInt(imei.slice(4, 8), 10) % 90000 + 10000)}`
  return { brand: entry.brand, model, typeApprovalNumber: taNum }
}

// ─── Core mock verification logic (shared, exported for client use) ────────────

// TODO: Replace with real GSMA IMEI DB or BOCRA internal database lookup

export function verifyImei(imei: string): VerificationResult {
  const checkedAt = new Date().toISOString()

  // Strip non-digits
  const cleaned = imei.replace(/\D/g, '')

  if (cleaned.length !== 15) {
    return {
      imei: cleaned || imei,
      status: 'FAILED_VERIFICATION',
      remarks: 'Invalid format — IMEI must be exactly 15 digits.',
      checkedAt,
    }
  }

  // Blacklisted prefix: 52
  if (cleaned.startsWith('52')) {
    return {
      imei: cleaned,
      status: 'BLACKLISTED',
      remarks: 'Device is on the BOCRA national blacklist. It may not be legally operated in Botswana.',
      checkedAt,
    }
  }

  // Blocked by operator: 01
  if (cleaned.startsWith('01')) {
    return {
      imei: cleaned,
      status: 'BLOCKED',
      remarks: 'Device has been reported lost or stolen by a network operator and is blocked.',
      checkedAt,
    }
  }

  // Duplicate IMEI: 99
  if (cleaned.startsWith('99')) {
    return {
      imei: cleaned,
      status: 'DUPLICATE',
      remarks: 'This IMEI appears more than once in the BOCRA registry, indicating a counterfeit device.',
      checkedAt,
    }
  }

  // Failed verification / bad checksum: 77
  if (cleaned.startsWith('77')) {
    return {
      imei: cleaned,
      status: 'FAILED_VERIFICATION',
      remarks: 'IMEI failed Luhn checksum verification. The device may be counterfeit.',
      checkedAt,
    }
  }

  // Verified: starts with 35
  if (cleaned.startsWith('35')) {
    const { brand, model, typeApprovalNumber } = pickDevice(cleaned)
    return {
      imei: cleaned,
      status: 'VERIFIED',
      brand,
      model,
      typeApprovalNumber,
      checkedAt,
    }
  }

  // Default: not in registry
  return {
    imei: cleaned,
    status: 'NOT_FOUND',
    remarks: 'IMEI not found in the BOCRA Type Approval registry. The device may not be approved for use in Botswana.',
    checkedAt,
  }
}

// ─── POST /api/device-verification ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { imei?: string; imeis?: string[] }

    // Batch mode
    if (Array.isArray(body.imeis)) {
      if (body.imeis.length > 500) {
        return NextResponse.json({ error: 'Batch limit is 500 IMEIs per request.' }, { status: 400 })
      }
      // Simulate processing delay proportional to batch size
      await new Promise((r) => setTimeout(r, Math.min(body.imeis!.length * 5, 800)))
      const results = body.imeis.map(verifyImei)
      return NextResponse.json({ results })
    }

    // Single mode
    const imei = body.imei?.trim()
    if (!imei) {
      return NextResponse.json({ error: 'imei is required.' }, { status: 400 })
    }

    // Simulate network latency
    await new Promise((r) => setTimeout(r, 250))

    return NextResponse.json(verifyImei(imei))
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
}
