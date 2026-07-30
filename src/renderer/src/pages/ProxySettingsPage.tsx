import React from 'react'
import { ProxyForm } from '../components/proxy/ProxyForm'

export function ProxySettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#111418]">
      {/* Page Header (30px title, 32px padding) */}
      <div className="px-8 py-6 border-b border-[#252932] bg-[#111418]">
        <h2 className="text-[30px] font-bold text-white tracking-tight leading-tight">Proxy Management</h2>
        <p className="text-sm text-[#B6BDC8] font-medium mt-1">
          Manage saved proxies, bulk import Webshare proxy lists, and assign per-profile network routes.
        </p>
      </div>

      <div className="p-8">
        <ProxyForm />
      </div>
    </div>
  )
}
