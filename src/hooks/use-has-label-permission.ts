import { Models } from "node-appwrite";

export const hasLabelAccess = (
    user: Models.User<Models.Preferences> | null,
    requiredLabels: string[],
    checkType: 'anyOf' | 'allOf' | 'noneOf' = 'anyOf'
  ) => {
    if (!user) return false;
  
    switch (checkType) {
      case 'anyOf':
        return requiredLabels.some(label => user.labels.includes(label));
      case 'allOf':
        return requiredLabels.every(label => user.labels.includes(label));
      case 'noneOf':
        return !requiredLabels.some(label => user.labels.includes(label));
      default:
        return false;
    }
  };