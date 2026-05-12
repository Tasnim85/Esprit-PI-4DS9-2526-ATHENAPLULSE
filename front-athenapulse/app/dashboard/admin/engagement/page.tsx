// app/dashboard/admin/engagement/page.tsx
import DashboardLayout from '../../../components/layout/DashboardLayout'
import EngagementReportsList from './EngagementReportsList'

export const metadata = {
  title: 'Rapports d\'engagement - AthenaPulse',
  description: 'Consultez les rapports d\'engagement des conversations HCP',
}

export default function EngagementPage() {
  return (
    <DashboardLayout role="administrateur">
      <EngagementReportsList />
    </DashboardLayout>
  )
}