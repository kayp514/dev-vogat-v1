'use client'

import { SignIn } from '@tern-secure/nextjs'

export default function Page() {
    return (
        <SignIn
         redirectUrl='/v0'
        />
    )
}