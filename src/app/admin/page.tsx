import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import React from 'react'
import AdminDasboardClient from './AdminDasboardClient'

async function AdminPage() {
    const user= await currentUser()

    //agar logged in nahi hai toh
    if(!user) redirect('/')

    const adminEmail = process.env.ADMIN_EMAIL
    const userEmail = user.emailAddresses[0]?.emailAddress

    if(!adminEmail || userEmail !== adminEmail) {
        redirect('/dashboard')
    }
  return (
    <AdminDasboardClient firstName={user.firstName} />
  )
}

export default AdminPage