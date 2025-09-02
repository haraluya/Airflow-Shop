import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES } from './constants';

// 基礎驗證 schema
export const emailSchema = z
  .string()
  .email({ message: ERROR_MESSAGES.INVALID_EMAIL });

export const passwordSchema = z
  .string()
  .min(VALIDATION.PASSWORD_MIN_LENGTH, { 
    message: ERROR_MESSAGES.PASSWORD_TOO_SHORT 
  });

export const phoneSchema = z
  .string()
  .regex(VALIDATION.PHONE_PATTERN, { 
    message: ERROR_MESSAGES.INVALID_PHONE 
  });

export const taxIdSchema = z
  .string()
  .regex(VALIDATION.TAX_ID_PATTERN, { 
    message: ERROR_MESSAGES.INVALID_TAX_ID 
  });

// 登入表單驗證
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

// 註冊表單驗證
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  displayName: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  companyName: z.string()
    .min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD })
    .max(VALIDATION.COMPANY_NAME_MAX_LENGTH),
  contactPerson: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  phoneNumber: phoneSchema,
  taxId: taxIdSchema.optional(),
  address: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  source: z.string().min(1, { message: '請說明您從何處得知本平台' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼確認不一致",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// 地址表單驗證
export const addressSchema = z.object({
  label: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  recipient: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  phone: phoneSchema,
  address: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  isDefault: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;

// 商品表單驗證
export const productFormSchema = z.object({
  // 基本資訊
  name: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }).max(200, { message: '商品名稱不能超過200字元' }),
  slug: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }).regex(/^[a-z0-9-]+$/, { message: 'URL代號只能包含小寫字母、數字和連字符' }),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }).max(50, { message: 'SKU不能超過50字元' }),
  
  // 分類與品牌
  categoryId: z.string().min(1, { message: '請選擇商品分類' }),
  brandId: z.string().optional(),
  
  // 價格
  basePrice: z.number().min(0, { message: '價格不可為負數' }),
  costPrice: z.number().min(0, { message: '成本價不可為負數' }).optional(),
  compareAtPrice: z.number().min(0, { message: '比較價不可為負數' }).optional(),
  
  // 庫存
  stock: z.number().int().min(0, { message: '庫存不可為負數' }),
  lowStockThreshold: z.number().int().min(0, { message: '低庫存閾值不可為負數' }),
  trackStock: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  
  // 規格與特色
  specifications: z.record(z.string()).optional(),
  features: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  
  // 狀態
  status: z.enum(['active', 'inactive', 'draft', 'archived']),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  
  // SEO
  seoTitle: z.string().max(60, { message: 'SEO標題不能超過60字元' }).optional(),
  seoDescription: z.string().max(160, { message: 'SEO描述不能超過160字元' }).optional(),
  seoKeywords: z.string().optional(),
  
  // 物流資訊
  weight: z.number().min(0, { message: '重量不可為負數' }).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
    unit: z.enum(['cm', 'inch'])
  }).optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

// 分類表單驗證
export const categorySchema = z.object({
  name: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  slug: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }).regex(/^[a-z0-9-]+$/, { message: 'URL代號只能包含小寫字母、數字和連字符' }),
  description: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().int().min(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// 品牌表單驗證
export const brandSchema = z.object({
  name: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  slug: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }).regex(/^[a-z0-9-]+$/, { message: 'URL代號只能包含小寫字母、數字和連字符' }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

export type BrandFormData = z.infer<typeof brandSchema>;

// 價格群組表單驗證
export const pricingGroupSchema = z.object({
  name: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed', 'tiered']),
  discountValue: z.number().min(0, { message: '折扣值不可為負數' }),
  minOrderAmount: z.number().min(0, { message: '最低訂單金額不可為負數' }).optional(),
  isActive: z.boolean().default(true),
});

export type PricingGroupFormData = z.infer<typeof pricingGroupSchema>;

// 驗證工具函數
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone: string): boolean => {
  try {
    phoneSchema.parse(phone);
    return true;
  } catch {
    return false;
  }
};

export const validateTaxId = (taxId: string): boolean => {
  try {
    taxIdSchema.parse(taxId);
    return true;
  } catch {
    return false;
  }
};

// 表單錯誤處理工具
export const getErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  return '發生未知錯誤';
};