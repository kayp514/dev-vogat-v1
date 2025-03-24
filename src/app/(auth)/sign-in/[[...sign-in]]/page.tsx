'use client'

import { SignIn } from '@tern-secure/nextjs'
import { ternSecureAuth } from '@tern-secure/nextjs'
import { verifyDatabaseUser } from '@/app/actions'


export default function Page() {
    const handleOnSuccess = async () => {
        try {
        const currentUser = await ternSecureAuth.currentUser

        if(!currentUser) {
            throw new Error("No user found after signin")
        }
        
        const result  = await verifyDatabaseUser(currentUser.uid, currentUser.tenantId || 'default')

        if (!result.success) {
            console.error("Verification failed:", result.error?.message)
            await ternSecureAuth.signOut()
            throw new Error(result.error?.message || "Verification failed")
        }

    } catch (error) {
        console.error("Error in handleOnSuccess:", error)
    }
}

const handleError = (error: Error) => {
    console.error("Sign in error:", error)
    // Handle error (show toast, notification, etc.)
}
    return <SignIn onSuccess={handleOnSuccess} onError={handleError} redirectUrl='/v0'/>
}