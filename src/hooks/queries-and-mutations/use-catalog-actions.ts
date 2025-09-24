"use client";

import {
  assignVariantToProductType,
  createCatalogCategory,
  createCatalogProductType,
  createCatalogSubcategory,
  createCatalogVariantOption,
  createCatalogVariantTemplate,
  deleteCatalogCategory,
  deleteCatalogProductType,
  deleteCatalogSubcategory,
  deleteCatalogVariantOption,
  deleteCatalogVariantTemplate,
  removeVariantFromProductType,
  updateCatalogCategory,
  updateCatalogProductType,
  updateCatalogSubcategory,
  updateCatalogVariantOption,
  updateCatalogVariantTemplate,
} from "@/lib/actions/catalog-server-actions";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useCreateCategory = () => {
  const router = useRouter();

  return useAction(createCatalogCategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });
};

export const useUpdateCategory = () => {
  const router = useRouter();

  return useAction(updateCatalogCategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });
};

export const useDeleteCategory = () => {
  const router = useRouter();

  return useAction(deleteCatalogCategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });
};

export const useCreateSubcategory = () => {
  const router = useRouter();

  return useAction(createCatalogSubcategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to create subcategory");
    },
  });
};

export const useUpdateSubcategory = () => {
  const router = useRouter();

  return useAction(updateCatalogSubcategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to update subcategory");
    },
  });
};

export const useDeleteSubcategory = () => {
  const router = useRouter();

  return useAction(deleteCatalogSubcategory, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to delete subcategory");
    },
  });
};

export const useCreateProductType = () => {
  const router = useRouter();

  return useAction(createCatalogProductType, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to create product type");
    },
  });
};

export const useUpdateProductType = () => {
  const router = useRouter();

  return useAction(updateCatalogProductType, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to update product type");
    },
  });
};

export const useDeleteProductType = () => {
  const router = useRouter();

  return useAction(deleteCatalogProductType, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to delete product type");
    },
  });
};

export const useCreateVariantTemplate = () => {
  const router = useRouter();

  return useAction(createCatalogVariantTemplate, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to create variant template");
    },
  });
};

export const useUpdateVariantTemplate = () => {
  const router = useRouter();

  return useAction(updateCatalogVariantTemplate, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to update variant template");
    },
  });
};

export const useDeleteVariantTemplate = () => {
  const router = useRouter();

  return useAction(deleteCatalogVariantTemplate, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to delete variant template");
    },
  });
};

export const useCreateVariantOption = () => {
  const router = useRouter();

  return useAction(createCatalogVariantOption, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to create variant option");
    },
  });
};

export const useUpdateVariantOption = () => {
  const router = useRouter();

  return useAction(updateCatalogVariantOption, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to update variant option");
    },
  });
};

export const useDeleteVariantOption = () => {
  const router = useRouter();

  return useAction(deleteCatalogVariantOption, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to delete variant option");
    },
  });
};

export const useRemoveVariantFromProductType = () => {
  const router = useRouter();

  return useAction(removeVariantFromProductType, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to remove variant from product type");
    },
  });
};

export const useAssignVariantToProductType = () => {
  const router = useRouter();

  return useAction(assignVariantToProductType, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toast.success(result.data.success);
        router.refresh();
      } else if (result.data?.error) {
        toast.error(result.data.error);
      }
    },
    onError: () => {
      toast.error("Failed to assign variant");
    },
  });
};
