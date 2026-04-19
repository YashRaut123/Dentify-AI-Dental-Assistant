import React from 'react'
import { syncUser } from '@/lib/actions/users'
import Navbar from '@/components/Navbar'
import WelcomeSection from '@/components/dashboard/WelcomeSection'
import MainActions from '@/components/dashboard/MainActions'
import ActivityOverview from '@/components/dashboard/ActivityOverview'

export const dynamic = 'force-dynamic'

async function Dashbord() {
  await syncUser()

  return (
    <>
    <Navbar/>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-24">
      <WelcomeSection/>
      <MainActions/>
      <ActivityOverview/>

    </div>

    
    </>
  )
}

export default Dashbord