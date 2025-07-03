
"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useTargets } from "@/hooks/use-targets";

const TargetsSchema = z.object({
  profit: z.coerce.number().min(0, "Profit target must be non-negative."),
  loss: z.coerce.number().min(0, "Loss limit must be non-negative."),
});

type TargetsFormValues = z.infer<typeof TargetsSchema>;

export function SetTargetsDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { targets, updateTargets, isLoaded } = useTargets();

  const form = useForm<TargetsFormValues>({
    resolver: zodResolver(TargetsSchema),
    defaultValues: {
      profit: 0,
      loss: 0,
    },
  });

  useEffect(() => {
    if (isLoaded) {
      form.reset({
        profit: targets.profit,
        loss: targets.loss,
      });
    }
  }, [isLoaded, targets, form, open]);

  const onSubmit = async (data: TargetsFormValues) => {
    setIsLoading(true);
    await updateTargets({ profit: data.profit, loss: Math.abs(data.loss) });
    setIsLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Your Targets</DialogTitle>
          <DialogDescription>
            Define your monthly profit target and maximum loss limit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="profit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profit Target ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="loss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Loss Limit ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
