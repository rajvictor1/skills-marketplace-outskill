"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side Better Auth client. Points at the same origin by default. Used
 * by the sign-in, sign-up, and account-menu components.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
