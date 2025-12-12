
export type UserRole = "admin" | "superuser" | "user" | "guest" | "member" | "staff"

export interface UserData {
    uid: string
    email: string
    phoneNumber?: string | null
    tenantId: string
    disabled: boolean
    createdAt: string
    lastSignInAt: string | null
    isAdmin?: boolean
    isSuperuser?: boolean
    isStaff?: boolean
    role?: UserRole
    customClaims: Record<string, any>
}