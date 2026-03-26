import { NextResponse } from 'next/server'

// TODO: Replace mock data with real query against
// device.type_approval_records joined with
// device.device_catalog and docs.certificates
// Filter by: brand_name ILIKE, model_name ILIKE,
// marketing_name ILIKE, is_sim_enabled
// Only return records where
// device.type_approval_records.status_code = 'APPROVED'

interface TechSpec {
  network_technology: string[]
  frequency_bands: string
  transmission_power: string
}

interface DeviceCatalog {
  id: string
  brand_name: string
  marketing_name: string
  model_name: string
  is_sim_enabled: boolean
  technical_spec_json: TechSpec
}

interface Certificate {
  id: string
  certificate_number: string
  certificate_type_code: string
  issued_at: string
  status_code: string
  qr_token: string
}

interface SearchResult {
  id: string
  device_model_id: string
  certificate_id: string
  status_code: 'APPROVED'
  approved_at: string
  device_catalog: DeviceCatalog
  certificate: Certificate
}

const MOCK_DB: SearchResult[] = [
  {
    id: 'tar-001',
    device_model_id: 'dev-001',
    certificate_id: 'cert-001',
    status_code: 'APPROVED',
    approved_at: '2025-11-14T00:00:00Z',
    device_catalog: {
      id: 'dev-001',
      brand_name: 'Samsung',
      marketing_name: 'Galaxy A55',
      model_name: 'SM-A556B',
      is_sim_enabled: true,
      technical_spec_json: {
        network_technology: ['4G', '5G', 'WiFi', 'Bluetooth'],
        frequency_bands: '700/800/900/1800/2100/2600 MHz',
        transmission_power: '23 dBm',
      },
    },
    certificate: {
      id: 'cert-001',
      certificate_number: 'TA/BW/2025/00441',
      certificate_type_code: 'TYPE_APPROVAL',
      issued_at: '2025-11-14T00:00:00Z',
      status_code: 'ACTIVE',
      qr_token: 'BOCRA-TA-2025-00441-QR',
    },
  },
  {
    id: 'tar-002',
    device_model_id: 'dev-002',
    certificate_id: 'cert-002',
    status_code: 'APPROVED',
    approved_at: '2025-08-03T00:00:00Z',
    device_catalog: {
      id: 'dev-002',
      brand_name: 'Samsung',
      marketing_name: 'Galaxy S24',
      model_name: 'SM-S921B',
      is_sim_enabled: true,
      technical_spec_json: {
        network_technology: ['4G', '5G', 'WiFi', 'Bluetooth'],
        frequency_bands: '700/800/1800/2100/2600 MHz',
        transmission_power: '24 dBm',
      },
    },
    certificate: {
      id: 'cert-002',
      certificate_number: 'TA/BW/2025/00389',
      certificate_type_code: 'TYPE_APPROVAL',
      issued_at: '2025-08-03T00:00:00Z',
      status_code: 'ACTIVE',
      qr_token: 'BOCRA-TA-2025-00389-QR',
    },
  },
  {
    id: 'tar-003',
    device_model_id: 'dev-003',
    certificate_id: 'cert-003',
    status_code: 'APPROVED',
    approved_at: '2026-01-22T00:00:00Z',
    device_catalog: {
      id: 'dev-003',
      brand_name: 'Huawei',
      marketing_name: 'Nova 12',
      model_name: 'HWI-AL00',
      is_sim_enabled: true,
      technical_spec_json: {
        network_technology: ['4G', 'WiFi', 'Bluetooth'],
        frequency_bands: '900/1800/2100 MHz',
        transmission_power: '23 dBm',
      },
    },
    certificate: {
      id: 'cert-003',
      certificate_number: 'TA/BW/2026/00017',
      certificate_type_code: 'TYPE_APPROVAL',
      issued_at: '2026-01-22T00:00:00Z',
      status_code: 'ACTIVE',
      qr_token: 'BOCRA-TA-2026-00017-QR',
    },
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand') ?? ''
  const model = searchParams.get('model') ?? ''
  const name  = searchParams.get('name')  ?? ''
  const sim   = searchParams.get('sim')   ?? 'all'

  if (!brand.trim()) {
    return NextResponse.json({ error: 'brand is required' }, { status: 400 })
  }

  let results = MOCK_DB.filter((r) =>
    r.device_catalog.brand_name.toLowerCase().includes(brand.toLowerCase())
  )

  if (model.trim()) {
    results = results.filter((r) =>
      r.device_catalog.model_name.toLowerCase().includes(model.toLowerCase())
    )
  }

  if (name.trim()) {
    results = results.filter((r) =>
      r.device_catalog.marketing_name.toLowerCase().includes(name.toLowerCase())
    )
  }

  if (sim === 'true') {
    results = results.filter((r) => r.device_catalog.is_sim_enabled)
  } else if (sim === 'false') {
    results = results.filter((r) => !r.device_catalog.is_sim_enabled)
  }

  return NextResponse.json(results)
}
