export const mapPluginName = (plugin?: string): string => {
    switch (plugin) {
        case "users-permissions":
            return "";
        case "upload":
            return "Strapi";
        case "admin":
            return "Admin";
        case "i18n":
            return "I18N";
        default:
            return "";
    }
};
