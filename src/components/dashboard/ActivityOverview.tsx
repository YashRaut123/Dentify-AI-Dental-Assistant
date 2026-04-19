import DentalHealthOverview from "./DentalHealthOverview"
import NextAppointment from "./NextAppointment"

function ActivityOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DentalHealthOverview/>
        <NextAppointment/>
    </div>
  )
}

export default ActivityOverview