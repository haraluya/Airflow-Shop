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

// 產品表單驗證
export const productSchema = z.object({
  name: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  description: z.string().optional(),
  category: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  brand: z.string().optional(),
  sku: z.string().min(1, { message: ERROR_MESSAGES.REQUIRED_FIELD }),
  price: z.number().min(0, { message: '價格不可為負數' }),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

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