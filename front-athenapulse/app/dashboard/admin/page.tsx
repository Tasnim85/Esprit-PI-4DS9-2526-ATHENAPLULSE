// app/dashboard/admin/engagement/page.tsx
import DashboardLayout from '../../components/layout/DashboardLayout'
import AdminDashboardContent from '../../components/dashboard/admin/AdminDashboardContent'

export default function AdminPage() {
  return (
    <DashboardLayout role="administrateur">
      <AdminDashboardContent />
    </DashboardLayout>
  )
}