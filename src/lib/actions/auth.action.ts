"use server";

import {
  createAdminClient,
  createDocumentPermissions,
  createSessionClient,
} from "@/lib/appwrite";
import { cookies, headers } from "next/headers";
import { AUTH_COOKIE, UserAccountType, UserRole } from "../constants";
import { APP_URL, DATABASE_ID, MAIN_DOMAIN, USER_DATA_ID } from "../env-config";
import {
  ID,
  OAuthProvider,
  Query,
  Models,
  Permission,
  Role,
} from "node-appwrite";
import { redirect } from "next/navigation";
import { createSafeActionClient } from "next-safe-action";
import { authMiddleware } from "./middlewares";
import {
  AddNewUserLabels,
  changePasswordSchema,
  CompletePasswordRecoverySchema,
  createUserDataSchema,
  DeleteUserAccount,
  InitiatePasswordRecoverySchema,
  loginSchema,
  signupSchema,
  updateEmailSchema,
  updatePhoneSchema,
  updateProfileSchema,
  verifyEmilSchema,
} from "../schemas/user-schema";
import countriesData from "@/data/countries.json";
import { UserDataTypes } from "../types";
import { updateUserLabels } from "./user-labels";
import z from "zod";

const action = createSafeActionClient({
  handleServerError: (error) => {
    return error.message;
  },
});

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();

    return await account.get();
  } catch {
    return null;
  }
}

export const logInAction = action
  .schema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      const { account } = await createAdminClient();
      const session = await account.createEmailPasswordSession(email, password);

      const cookieStore = await cookies();

      cookieStore.set(AUTH_COOKIE, session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });

      return { success: "You are logged in.", session };
    } catch (error) {
      console.error("signIn user action Error", error);
      return {
        error: error instanceof Error ? error.message : "Failed to login",
      };
    }
  });

export const signUpAction = action
  .schema(signupSchema)
  .action(
    async ({ parsedInput: { email, password, phoneNumber, fullName } }) => {
      try {
        const { account, databases, users } = await createAdminClient();
        const isExistingUser = await users.list([
          Query.equal("email", [email]),
        ]);

        if (isExistingUser.total > 0) {
          return { error: "User with this email already exists" };
        }

        const newAcc = await account.create(
          ID.unique(),
          email,
          password,
          fullName
        );

        if (phoneNumber) {
          try {
            const cleanedPhone = phoneNumber.replace(/[^\d+]/g, "");
            if (cleanedPhone.startsWith("+") && cleanedPhone.length <= 16) {
              await account.updatePhone(cleanedPhone, password);
            } else {
              console.warn("Invalid phone number format:", phoneNumber);
            }
          } catch (error) {
            console.warn("Failed to add phone number during signup:", error);
          }
        }

        await databases.createDocument(
          DATABASE_ID,
          USER_DATA_ID,
          newAcc.$id,
          {
            fullName,
            email,
            phoneNumber: phoneNumber || "",
            accountType: UserAccountType.BUYER,
          },
          [
            Permission.delete(Role.user(newAcc.$id)),
            Permission.update(Role.user(newAcc.$id)),
          ]
        );

        const session = await account.createEmailPasswordSession(
          email,
          password
        );

        const cookieStore = await cookies();

        cookieStore.set(AUTH_COOKIE, session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          maxAge: 30 * 24 * 60 * 60,
        });

        return {
          success: "Account created successfully.",
          user: newAcc,
        };
      } catch (error) {
        console.error("create user action Error", error);
        return {
          error:
            error instanceof Error ? error.message : "Failed to create user",
        };
      }
    }
  );

export const createUserData = action
  .schema(createUserDataSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user: currentUser } = ctx;
    const { databases } = await createAdminClient();

    try {
      if (currentUser.$id !== parsedInput.userId) {
        return { error: "Unauthorized: Can only manage your own profile" };
      }

      try {
        const existingDocument = await databases.getDocument(
          DATABASE_ID,
          USER_DATA_ID,
          parsedInput.userId
        );

        if (existingDocument) {
          const updatedDocument = await databases.updateDocument(
            DATABASE_ID,
            USER_DATA_ID,
            parsedInput.userId,
            {
              fullName: parsedInput.fullName,
              email: parsedInput.email,
              phoneNumber: parsedInput.phoneNumber || "",
              bio: parsedInput.bio || "",
              website: parsedInput.website || "",
              accountType: UserAccountType.BUYER,
            }
          );

          return {
            success: "Profile updated successfully.",
            document: updatedDocument,
          };
        }
      } catch (error) {
        console.log("Document doesn't exist, creating new one");
      }

      const newDocument = await databases.createDocument(
        DATABASE_ID,
        USER_DATA_ID,
        parsedInput.userId,
        {
          fullName: parsedInput.fullName,
          email: parsedInput.email,
          phoneNumber: parsedInput.phoneNumber || "",
          bio: parsedInput.bio || "",
          website: parsedInput.website || "",
          accountType: UserAccountType.BUYER,
        },
        createDocumentPermissions({ userId: parsedInput.userId })
      );

      return {
        success: "Profile created successfully.",
        document: newDocument,
      };
    } catch (error) {
      console.error("createUserDataDocument Error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to create profile",
      };
    }
  });

export const changePasswordAction = action
  .schema(changePasswordSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput: { currentPassword, newPassword }, ctx }) => {
    const { account } = ctx;
    try {
      await account.updatePassword(newPassword, currentPassword);

      return { success: "Password updated successfully" };
    } catch (error) {
      console.error("Change Password Error:", error);

      if (error instanceof Error) {
        if (error.message.includes("Invalid credentials")) {
          return { error: "Current password is incorrect" };
        }
        if (error.message.includes("Password must be")) {
          return { error: "New password does not meet requirements" };
        }
      }

      return {
        error:
          error instanceof Error ? error.message : "Failed to update password",
      };
    }
  });

export const updateEmailAction = action
  .schema(updateEmailSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput: { newEmail, password }, ctx }) => {
    const { account, user, databases } = ctx;

    try {
      await account.updateEmail(newEmail, password);

      try {
        await databases.updateDocument(DATABASE_ID, USER_DATA_ID, user.$id, {
          email: newEmail,
        });
      } catch (dbError) {
        console.warn("Failed to update email in user data:", dbError);
        // Account email was updated, but database sync failed
        // You might want to implement a retry mechanism or manual sync
      }
      return {
        success:
          "Email update initiated. Please check your new email for verification.",
      };
    } catch (error) {
      console.error("Update Email Error:", error);

      if (error instanceof Error) {
        if (error.message.includes("Invalid credentials")) {
          return { error: "Password is incorrect" };
        }
        if (error.message.includes("already exists")) {
          return { error: "This email is already in use by another account" };
        }
      }

      return {
        error:
          error instanceof Error ? error.message : "Failed to update email",
      };
    }
  });

export const updatePhoneAction = action
  .schema(updatePhoneSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput: { phoneNumber, password }, ctx }) => {
    const { account, databases, user } = ctx;

    try {
      const cleanedPhone = phoneNumber.replace(/[^\d+]/g, "");
      if (!cleanedPhone.startsWith("+") || cleanedPhone.length > 16) {
        return {
          error:
            "Invalid phone number format. Please include country code (e.g., +250)",
        };
      }

      await account.updatePhone(cleanedPhone, password);

      try {
        await databases.updateDocument(DATABASE_ID, USER_DATA_ID, user.$id, {
          phoneNumber: cleanedPhone,
        });
      } catch (dbError) {
        console.warn("Failed to update phone in user data:", dbError);
        // Account phone was updated, but database sync failed
      }

      return { success: "Phone number updated successfully" };
    } catch (error) {
      console.error("Update Phone Error:", error);

      if (error instanceof Error) {
        if (error.message.includes("Invalid credentials")) {
          return { error: "Password is incorrect" };
        }
        if (error.message.includes("already exists")) {
          return { error: "This phone number is already in use" };
        }
      }

      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update phone number",
      };
    }
  });

export const updateAccountNameAction = action
  .schema(
    z.object({
      fullName: z.string().min(2, "Full name must be at least 2 characters"),
    })
  )
  .use(authMiddleware)
  .action(async ({ parsedInput: { fullName }, ctx }) => {
    const { account, databases, user } = ctx;

    try {
      await account.updateName(fullName);

      try {
        await databases.updateDocument(DATABASE_ID, USER_DATA_ID, user.$id, {
          fullName: fullName,
        });
      } catch (dbError) {
        console.warn("Failed to update name in user data:", dbError);
      }

      return { success: "Name updated successfully" };
    } catch (error) {
      console.error("Update Name Error:", error);
      return {
        error: error instanceof Error ? error.message : "Failed to update name",
      };
    }
  });

export const updateProfileAction = action
  .schema(updateProfileSchema)
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { databases, user, account } = ctx;

    try {
      if (parsedInput.fullName) {
        try {
          await account.updateName(parsedInput.fullName);
        } catch (nameError) {
          console.warn("Failed to update account name:", nameError);
          // Continue with database update even if account name update fails
        }
      }

      const updatedDocument = await databases.updateDocument(
        DATABASE_ID,
        USER_DATA_ID,
        user.$id,
        {
          fullName: parsedInput.fullName,
          bio: parsedInput.bio || "",
          website: parsedInput.website || "",
          phoneNumber: parsedInput.phoneNumber || "",
          // Social links
          instagram: parsedInput.instagram || "",
          twitter: parsedInput.twitter || "",
          facebook: parsedInput.facebook || "",
          linkedin: parsedInput.linkedin || "",
        }
      );

      return {
        success: "Profile updated successfully",
        document: updatedDocument,
      };
    } catch (error) {
      console.error("Update Profile Error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      };
    }
  });

export const getAccountSessions = async () => {
  try {
    const { account } = await createSessionClient();

    const sessions = await account.listSessions();

    return sessions;
  } catch (error) {
    console.error("Get Sessions Error:", error);
    return null;
  }
};

export const deleteSessionAction = action
  .schema(z.object({ sessionId: z.string() }))
  .use(authMiddleware)
  .action(async ({ parsedInput: { sessionId }, ctx }) => {
    const { account } = ctx;

    try {
      await account.deleteSession(sessionId);

      return { success: "Session terminated successfully" };
    } catch (error) {
      console.error("Delete Session Error:", error);
      return { error: "Failed to terminate session" };
    }
  });

export const deleteOtherSessionsAction = action
  .use(authMiddleware)
  .action(async ({ ctx }) => {
    const { account } = ctx;

    try {
      const sessions = await account.listSessions();
      const currentSession = await account.getSession("current");

      const otherSessions = sessions.sessions.filter(
        (session) => session.$id !== currentSession.$id
      );

      // Delete other sessions one by one
      for (const session of otherSessions) {
        try {
          await account.deleteSession(session.$id);
        } catch (error) {
          console.warn(`Failed to delete session ${session.$id}:`, error);
        }
      }

      return {
        success: `Terminated ${otherSessions.length} other session(s)`,
        terminatedCount: otherSessions.length,
      };
    } catch (error) {
      console.error("Delete Other Sessions Error:", error);
      return { error: "Failed to terminate other sessions" };
    }
  });

export const createEmailVerification = action
  .use(authMiddleware)
  .action(async ({ ctx }) => {
    const { account, user } = ctx;

    try {
      const verification = await account.createVerification(
        `${APP_URL}/verify-email`
      );
      return {
        success: "Account created. Please verify your email.",
        userId: user.$id,
        verificationId: verification.$id,
      };
    } catch (error) {
      console.error("create user action Error", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create email verification",
      };
    }
  });

export const logoutCurrentUser = async () => {
  try {
    const { account } = await createSessionClient();
    const currentUser = await account.get();

    if (!currentUser) throw new Error("No current user");

    await account.deleteSession("current");

    const cookieStore = await cookies();

    cookieStore.delete(AUTH_COOKIE);
  } catch (error) {
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  try {
    const { databases } = await createSessionClient();
    const userData = await databases.getDocument<UserDataTypes>(
      DATABASE_ID,
      USER_DATA_ID,
      userId
    );

    return userData;
  } catch (error) {
    console.log("getUserData: ", error);
    return null;
  }
};

export const loginWithGoogle = async () => {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin") || MAIN_DOMAIN;

    const { account } = await createSessionClient();

    const authorizationUrl = await account.createOAuth2Token(
      OAuthProvider.Google,
      `${origin}/api/oauth/callback`,
      `${origin}/sign-in?google-auth-error=true`
    );

    return { url: authorizationUrl };
  } catch (error) {
    console.error("Google OAuth initiation failed:", error);
    throw error;
  }
};

export const verifyEmailAction = action
  .use(authMiddleware)
  .schema(verifyEmilSchema)
  .action(async ({ parsedInput: { secret, userId } }) => {
    try {
      const { account } = await createSessionClient();

      await account.updateVerification(userId, secret);

      return { success: "Email verified successfully" };
    } catch (error) {
      console.error("Email Verification Error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Email verification failed",
      };
    }
  });

export const initiatePasswordRecovery = action
  .schema(InitiatePasswordRecoverySchema)
  .action(async ({ parsedInput: { email } }) => {
    try {
      const { account } = await createSessionClient();
      const recoveryResponse = await account.createRecovery(
        email,
        `${APP_URL}/reset-password`
      );

      return {
        success: "Initiated password reset",
        recoveryResponse,
      };
    } catch (error) {
      console.error("Failed to initiate password recovery", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate password recovery",
      };
    }
  });

export const completePasswordRecovery = action
  .schema(CompletePasswordRecoverySchema)
  .action(async ({ parsedInput: { newPassword, secret, userId } }) => {
    try {
      const { account } = await createSessionClient();
      const recoveryResponse = await account.updateRecovery(
        userId,
        secret,
        newPassword
      );
      return {
        success: "Password updated successfully",
        recoveryResponse,
      };
    } catch (error) {
      console.error("Password Recovery Completion Error:", error);
      return {
        error:
          error instanceof Error ? error.message : "Email verification failed",
      };
    }
  });

export const getUserLocale = async () => {
  try {
    const { locale } = await createSessionClient();
    const result = await locale.get();

    if (!result.currency || result.currency.trim() === "") {
      const fallback = countriesData.find(
        (c) =>
          c.code.toLowerCase() === result.countryCode.toLowerCase() ||
          c.name.toLowerCase() === result.country.toLowerCase()
      );

      if (fallback?.currency) {
        result.currency = fallback.currency;
      }
    }

    return result;
  } catch (error) {
    console.error("useUserLocale:", error);
    return null;
  }
};

export const getCountriesLocale = async () => {
  try {
    const { locale } = await createSessionClient();
    const result = await locale.listCountries();

    return result;
  } catch (error) {
    console.error("getCountriesLocale:", error);
  }
};
export const getCurrencyList = async () => {
  try {
    const { locale } = await createSessionClient();
    const result = await locale.listCurrencies();

    return result;
  } catch (error) {
    console.error("getCurrencyList:", error);
  }
};

export async function getUserTeams() {
  try {
    const { teams } = await createSessionClient();

    const teamsList = await teams.list();

    return teamsList.teams || [];
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return [];
  }
}

export async function getUserMemberships(): Promise<Models.Membership[]> {
  try {
    const { teams } = await createSessionClient();

    const teamList = await teams.list();
    const allMemberships: Models.Membership[] = [];

    for (const team of teamList.teams) {
      try {
        const memberships = await teams.listMemberships(team.$id);
        const enhancedMemberships = memberships.memberships.map(
          (memberships) => ({
            ...memberships,
            teamName: team.name,
            teamId: team.$id,
          })
        );

        allMemberships.push(...enhancedMemberships);
      } catch (error) {
        console.error(
          `Error fetching memberships for team ${team.$id}:`,
          error
        );
        // Continue with other teams even if one fails
        continue;
      }
    }

    return allMemberships;
  } catch (error) {
    console.error("Error fetching user memberships:", error);
    return [];
  }
}

export async function getUserMembershipForTeam(
  teamId: string
): Promise<Models.Membership | null> {
  try {
    const { teams, account } = await createSessionClient();
    const user = await account.get();
    const memberships = await teams.listMemberships(teamId);

    const userMembership = memberships.memberships.find(
      (membership) => membership.userId === user.$id
    );

    if (userMembership) {
      // Get team details to add team name
      const team = await teams.get(teamId);
      return {
        ...userMembership,
        teamName: team.name,
        teamId: team.$id,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching user membership for team ${teamId}:`, error);
    return null;
  }
}

export async function isUserMemberOfTeam(teamId: string): Promise<boolean> {
  try {
    const membership = await getUserMembershipForTeam(teamId);
    return membership !== null;
  } catch (error) {
    console.error(`Error checking team membership for ${teamId}:`, error);
    return false;
  }
}

export async function getUserRoleInTeam(
  teamId: string
): Promise<string | null> {
  try {
    const membership = await getUserMembershipForTeam(teamId);
    return membership?.roles?.[0] || null;
  } catch (error) {
    console.error(`Error getting user role in team ${teamId}:`, error);
    return null;
  }
}

export async function getTeamsByPattern(
  pattern: RegExp
): Promise<Models.Team<Models.Preferences>[]> {
  try {
    const teams = await getUserTeams();
    return teams.filter((team) => pattern.test(team.name));
  } catch (error) {
    console.error("Error filtering teams by pattern:", error);
    return [];
  }
}

export const updateUserAccountType = action
  .schema(AddNewUserLabels)
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    try {
      if (
        parsedInput.labels.length === 1 &&
        parsedInput.labels[0] === UserRole.VIRTUAL_STORE_OWNER &&
        user.$id === parsedInput.userId
      ) {
        updateUserLabels(parsedInput.userId, parsedInput.labels);
        return { success: true };
      }
      return { error: "something went wrong" };
    } catch (error) {
      console.error("updateUserAccountType Error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "updateUserAccountType failed",
      };
    }
  });

export const deleteUserAccount = action
  .schema(DeleteUserAccount)
  .use(authMiddleware)
  .action(async ({ parsedInput, ctx }) => {
    const { user: currentUser, databases } = ctx;
    const { users } = await createAdminClient();
    const cookieStore = await cookies();
    try {
      if (currentUser.$id !== parsedInput.userId) {
        return { error: "Action denied." };
      }

      try {
        await databases.deleteDocument(
          DATABASE_ID,
          USER_DATA_ID,
          currentUser.$id
        );
      } catch (error) {
        console.warn("Failed to delete user document:", error);
      }

      try {
        await ctx.account.deleteSessions();
      } catch (error) {
        console.warn("Failed to delete user sessions:", error);
      }

      await users.delete(parsedInput.userId);

      cookieStore.delete(AUTH_COOKIE);
      return { success: "Your account has been deleted." };
    } catch (error) {
      console.error("deleteUserAccount Error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "updateUserAccountType failed",
      };
    }
  });
