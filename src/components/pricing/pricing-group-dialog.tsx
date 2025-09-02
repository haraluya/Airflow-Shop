'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit } from 'lucide-react';
import { PricingGroup } from '@/lib/types/product';

const pricingGroupSchema = z.object({
  name: z.string().min(1, '群組名稱為必填欄位'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed', 'tiered']),
  discountValue: z.number().min(0, '折扣值不能為負數'),
  isActive: z.boolean(),
});

type PricingGroupFormData = z.infer<typeof pricingGroupSchema>;

interface PricingGroupDialogProps {
  group?: PricingGroup;
  onSave: (data: Omit<PricingGroup, 'id' | 'createdAt' | 'updatedAt' | 'customerIds'>) => Promise<void>;
  children?: React.ReactNode;
}

export function PricingGroupDialog({
  group,
  onSave,
  children
}: PricingGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PricingGroupFormData>({
    resolver: zodResolver(pricingGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      isActive: true,
    },
  });

  // 重設表單當群組資料改變時
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || '',
        discountType: group.discountType,
        discountValue: group.discountValue,
        isActive: group.isActive,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        isActive: true,
      });
    }
  }, [group, form]);

  const onSubmit = async (data: PricingGroupFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('保存價格群組失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const discountType = form.watch('discountType');

  const getDiscountValueLabel = () => {
    switch (discountType) {
      case 'percentage':
        return '折扣百分比 (%)';
      case 'fixed':
        return '固定折扣金額 ($)';
      case 'tiered':
        return '階層式折扣（暫不支援）';
      default:
        return '折扣值';
    }
  };

  const getDiscountValuePlaceholder = () => {
    switch (discountType) {
      case 'percentage':
        return '輸入 0-100 之間的百分比';
      case 'fixed':
        return '輸入固定折扣金額';
      case 'tiered':
        return '階層式折扣（暫不支援）';
      default:
        return '輸入折扣值';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            {group ? (
              <>
                <Edit className="mr-2 h-4 w-4" />
                編輯群組
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                新增群組
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {group ? '編輯價格群組' : '新增價格群組'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>群組名稱</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：VIP客戶、批發商" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>群組說明（可選）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="描述這個價格群組的用途和特色"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>折扣類型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇折扣類型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">百分比折扣</SelectItem>
                      <SelectItem value="fixed">固定金額折扣</SelectItem>
                      <SelectItem value="tiered" disabled>
                        階層式折扣（暫未開放）
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getDiscountValueLabel()}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? 100 : undefined}
                      step={discountType === 'percentage' ? 1 : 0.01}
                      placeholder={getDiscountValuePlaceholder()}
                      disabled={discountType === 'tiered'}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">啟用群組</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      停用後，此群組將不會套用到任何客戶
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : group ? '更新群組' : '建立群組'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}