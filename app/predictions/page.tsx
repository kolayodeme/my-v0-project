import { PredictionsView } from "@/components/predictions-view"

export default function PredictionsPage() {
  return (
    <div className="container px-2 py-2 mx-auto">
      <h1 className="mb-3 text-lg font-bold">Match Predictions</h1>
      <PredictionsView />
    </div>
  )
}
