import DashboardLayout from '../../components/layout/DashboardLayout'
import DelegueDashboard from '../../components/dashboard/delegue/DelegueDashboardContent'
export default function DelegueLayout() {
  return (
    <DashboardLayout role="delegue">
      <DelegueDashboard />
    </DashboardLayout>
  )
}