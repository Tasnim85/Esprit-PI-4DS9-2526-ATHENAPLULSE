'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

type Role = 'delegue' | 'hcp' | 'administrateur'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: Role
}

const mockUsers: Record<Role, { nom: string; prenom: string; role: string }> = {
  delegue: { prenom: 'Karim', nom: 'Benali', role: 'Délégué Médical' },
  hcp: { prenom: 'Dr. Sarah', nom: 'Mansouri', role: 'Professionnel de Santé' },
  administrateur: { prenom: 'Admin', nom: 'Vital', role: 'Administrateur' },
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const user = mockUsers[role]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-1)' }}>
      <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Header sidebarCollapsed={collapsed} user={user} />
      <main style={{
        marginLeft: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        paddingTop: 'var(--header-height)',
        transition: 'margin-left var(--transition-slow)',
        minHeight: '100vh',
      }}>
        <div style={{ padding: '28px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}