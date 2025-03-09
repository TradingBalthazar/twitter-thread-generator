import { ThreadGenerator } from "@/components/thread-generator"
import { DashboardHeader } from "@/components/dashboard-header"

export default function ThreadGeneratorPage() {
  return (
    <div className="container mx-auto py-8">
      <DashboardHeader
        loading={false}
        onRefresh={() => {}}
        onRunMonitor={() => {}}
      />
      <div className="mt-8">
        <ThreadGenerator />
      </div>
    </div>
  )
}