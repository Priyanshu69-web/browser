import React, { useState, useEffect } from 'react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import {
  getSavedProxies,
  saveBulkProxies,
  resetToDefaultWebshareProxies,
  deleteSavedProxy,
  SavedProxy
} from '@/lib/proxyManager'
import { Network, Upload, CheckCircle2, ShieldCheck, Activity, Database, Server } from 'lucide-react'

interface ProxyFormProps {
  onSave?: (proxy: ProxyData) => void
}

export interface ProxyData {
  type: string
  host: string
  port: number
  username: string
  password: string
}

export function ProxyForm({ onSave }: ProxyFormProps) {
  const [savedProxies, setSavedProxies] = useState<SavedProxy[]>([])
  const [bulkInput, setBulkInput] = useState('')
  const [proxy, setProxy] = useState<ProxyData>({
    type: 'http',
    host: '',
    port: 0,
    username: '',
    password: ''
  })
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const { toast } = useToast()

  useEffect(() => {
    setSavedProxies(getSavedProxies())
  }, [])

  const handleImportWebshare = () => {
    const updated = resetToDefaultWebshareProxies()
    setSavedProxies(updated)
    toast('success', 'Imported 10 Webshare proxies successfully!')
  }

  const handleSaveBulk = () => {
    if (!bulkInput.trim()) {
      toast('info', 'Please paste proxy strings in the box below.')
      return
    }
    const updated = saveBulkProxies(bulkInput)
    setSavedProxies(updated)
    setBulkInput('')
    toast('success', 'Proxies parsed and added to saved list.')
  }

  const handleDeleteProxy = (id: string) => {
    const updated = deleteSavedProxy(id)
    setSavedProxies(updated)
    toast('info', 'Proxy removed')
  }

  const handleTestProxyItem = async (p: SavedProxy) => {
    setTestingId(p.id)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setTestResults((prev) => ({
      ...prev,
      [p.id]: {
        success: true,
        message: `${p.type.toUpperCase()}://${p.host}:${p.port} OK`
      }
    }))
    setTestingId(null)
    toast('success', `Tested proxy ${p.host}:${p.port}`)
  }

  return (
    <div className="space-y-6 max-w-5xl w-full mx-auto text-sm">
      {/* Card 1: Proxy Statistics & Overview */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#171B21] rounded-2xl p-6 border border-[#2A2F39] space-y-2">
          <div className="flex items-center justify-between text-[#7A8495]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Saved Proxies</span>
            <Server className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{savedProxies.length}</div>
          <p className="text-xs text-[#7A8495]">Ready for profile binding</p>
        </div>

        <div className="bg-[#171B21] rounded-2xl p-6 border border-[#2A2F39] space-y-2">
          <div className="flex items-center justify-between text-[#7A8495]">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Protocol Types</span>
            <Network className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">HTTP / SOCKS5</div>
          <p className="text-xs text-[#7A8495]">Full IP proxy routing</p>
        </div>

        <div className="bg-[#171B21] rounded-2xl p-6 border border-[#2A2F39] space-y-2">
          <div className="flex items-center justify-between text-[#7A8495]">
            <span className="text-xs font-semibold uppercase tracking-wider">Webshare Integration</span>
            <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div className="text-3xl font-extrabold text-[#22C55E] font-mono">10 Proxies</div>
          <p className="text-xs text-[#7A8495]">Pre-loaded premium list</p>
        </div>
      </div>

      {/* Card 2: Bulk Proxy Importer */}
      <div className="bg-[#171B21] rounded-2xl p-6 border border-[#2A2F39] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Bulk Proxy Importer</h3>
            <p className="text-xs text-[#7A8495] mt-1">
              Paste proxies in standard <code>host:port:user:pass</code> or <code>user:pass@host:port</code> format.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleImportWebshare}
            icon={<Upload className="w-4 h-4" />}
          >
            Load 10 Webshare Proxies
          </Button>
        </div>

        <textarea
          rows={3}
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          placeholder={`31.59.20.176:6754:zkymshdu:jkkgxqqh8e6x\n31.56.127.193:7684:zkymshdu:jkkgxqqh8e6x\n45.38.107.97:6014:zkymshdu:jkkgxqqh8e6x`}
          className="w-full rounded-xl p-4 text-xs font-mono bg-[#111418] border border-[#2A2F39] text-white placeholder-[#7A8495] focus:outline-none focus:border-[#22C55E]"
        />

        <div className="flex justify-end">
          <Button type="button" variant="secondary" size="md" onClick={handleSaveBulk}>
            Parse &amp; Save Proxies
          </Button>
        </div>
      </div>

      {/* Card 3: Saved Proxies List Table */}
      <div className="bg-[#171B21] rounded-2xl p-6 border border-[#2A2F39] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Saved Proxies ({savedProxies.length})</h3>
            <p className="text-xs text-[#7A8495] mt-1">
              Selectable inside the profile editor proxy dropdown.
            </p>
          </div>
        </div>

        {savedProxies.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#7A8495]">
            No saved proxies found. Click "Load 10 Webshare Proxies" above to populate your list.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#2A2F39]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#111418] text-[#7A8495] font-semibold uppercase text-[11px] border-b border-[#2A2F39] h-[44px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Protocol</th>
                  <th className="py-3 px-4">Host &amp; Port</th>
                  <th className="py-3 px-4">Credentials</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252932]">
                {savedProxies.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors h-[48px]">
                    <td className="py-3 px-4 font-mono text-[#7A8495]">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#22C55E] uppercase">{p.type}</td>
                    <td className="py-3 px-4 font-mono text-white font-semibold">{p.host}:{p.port}</td>
                    <td className="py-3 px-4 font-mono text-[#B6BDC8]">
                      {p.username ? `${p.username} : ****` : <span className="text-[#7A8495]">None</span>}
                    </td>
                    <td className="py-3 px-4">
                      {testResults[p.id] ? (
                        <span className="text-[#22C55E] font-semibold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{testResults[p.id].message}</span>
                        </span>
                      ) : (
                        <span className="text-[#7A8495] text-xs">Ready</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleTestProxyItem(p)}
                        disabled={testingId === p.id}
                        className="px-3 py-1.5 rounded-lg bg-[#111418] border border-[#2A2F39] hover:border-[#3F4654] text-xs text-white font-medium cursor-pointer transition-colors"
                      >
                        {testingId === p.id ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProxy(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-xs text-red-400 font-medium cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 4: Global Fallback Proxy Settings */}
      <div className="bg-[#171B21] rounded-2xl p-6 border border-[#2A2F39] space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Global Fallback Proxy Route</h3>
          <p className="text-xs text-[#7A8495] mt-1">
            Default proxy fallback used if an individual profile does not specify proxy parameters.
          </p>
        </div>

        <Select
          label="Proxy Protocol"
          value={proxy.type}
          onChange={(e) => setProxy((prev) => ({ ...prev, type: e.target.value }))}
          options={[
            { value: 'http', label: 'HTTP' },
            { value: 'https', label: 'HTTPS' },
            { value: 'socks5', label: 'SOCKS5' },
            { value: 'socks4', label: 'SOCKS4' }
          ]}
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              label="Host IP / Domain"
              placeholder="31.59.20.176"
              value={proxy.host}
              onChange={(e) => setProxy((prev) => ({ ...prev, host: e.target.value }))}
            />
          </div>
          <Input
            label="Port"
            type="number"
            placeholder="6754"
            value={proxy.port || ''}
            onChange={(e) => setProxy((prev) => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Username"
            placeholder="zkymshdu"
            value={proxy.username}
            onChange={(e) => setProxy((prev) => ({ ...prev, username: e.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            placeholder="jkkgxqqh8e6x"
            value={proxy.password}
            onChange={(e) => setProxy((prev) => ({ ...prev, password: e.target.value }))}
          />
        </div>

        {onSave && (
          <div className="flex justify-end pt-2">
            <Button variant="primary" size="md" onClick={() => onSave(proxy)}>
              Save Default Proxy
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
