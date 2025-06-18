import { StatisticsGraphs } from "@/components/statistics-graphs"

export default function StatisticsPage() {
  return (
    <div className="container px-2 py-2 mx-auto">
      <h1 className="mb-3 text-lg font-bold">Team Statistics</h1>
      <StatisticsGraphs />
    </div>
  )
}
