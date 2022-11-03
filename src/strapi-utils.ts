export const mapPluginName = (plugin?: string): string => {
    switch (plugin) {
        case "users-permissions":
            return "UsersPermissions";
        case "upload":
        case "admin":
            return "Strapi";
        case "i18n":
            return "I18N";
        default:
            return "";
    }
};
