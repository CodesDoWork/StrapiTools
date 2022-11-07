import { Type } from "./types";

export const extraTypes: Record<string, Type> = {
    userLoginType: {
        id: "custom::UserLogin",
        name: "UserLoginForm",
        isToSend: true,
        entries: [
            {
                name: "identifier",
                type: { types: ["string"] },
                isRequired: true,
                isOptional: false,
                isPrivate: false,
            },
            {
                name: "password",
                type: { types: ["string"] },
                isRequired: true,
                isOptional: false,
                isPrivate: false,
            },
        ],
    },

    authResponseType: {
        id: "custom::AuthResponse",
        name: "AuthResponse",
        isToSend: false,
        entries: [
            {
                name: "jwt",
                type: { types: ["string"] },
                isRequired: true,
                isOptional: false,
                isPrivate: false,
            },
            {
                name: "user",
                type: { types: ["plugin::users-permissions.user"] },
                isRequired: true,
                isOptional: false,
                isPrivate: false,
            },
        ],
    },
};
