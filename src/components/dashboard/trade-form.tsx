"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, ImageUp, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Trade, TradeSchema } from "@/lib/types";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const FormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  asset: z.enum(["NAS100", "XAUUSD"]),
  strategy: z.enum(["NQ #1", "NQ #2", "Gold"]),
  direction: z.enum(["Buy", "Sell"]),
  entryTime: z.string().nonempty({ message: "Entry time is required." }),
  entryPrice: z.coerce.number({ required_error: "Entry price is required." }),
  sl: z.coerce.number({ required_error: "Stop loss is required." }),
  tp: z.coerce.number({ required_error: "Take profit is required." }),
  rr: z.coerce.number().optional(),
  exitPrice: z.coerce.number({ required_error: "Exit price is required." }),
  result: z.enum(["Win", "Loss", "BE"]),
  mistake: z.boolean().default(false),
  notes: z.string().optional(),
  screenshot: z.string().optional(),
});

type TradeFormProps = {
  trade?: Trade;
  onSave: (trade: Trade) => void;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function TradeForm({ trade, onSave, setOpen }: TradeFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(trade?.screenshot || null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: trade || {
      date: new Date(),
      mistake: false,
      direction: "Buy",
      result: "Win",
      asset: "NAS100",
      strategy: "NQ #1",
    },
  });

  const { watch, setValue } = form;
  const entryPrice = watch("entryPrice");
  const sl = watch("sl");
  const tp = watch("tp");
  const direction = watch("direction");

  useEffect(() => {
    if (entryPrice && sl && tp) {
      let rr = 0;
      const risk = Math.abs(entryPrice - sl);
      const reward = Math.abs(tp - entryPrice);
      if (risk > 0) {
        rr = reward / risk;
      }
      setValue("rr", parseFloat(rr.toFixed(2)));
    }
  }, [entryPrice, sl, tp, direction, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setValue("screenshot", base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSaving(true);
    const newTrade: Trade = {
      ...TradeSchema.partial({ id: true }).parse(data),
      id: trade?.id || crypto.randomUUID(),
    };
    onSave(newTrade);
    setIsSaving(false);
    toast({ title: "Trade Saved!", description: "Your trade has been successfully logged." });
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entryTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="asset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NAS100">NAS100</SelectItem>
                    <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a strategy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NQ #1">NQ #1</SelectItem>
                    <SelectItem value="NQ #2">NQ #2</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="entryPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Price</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stop Loss (SL)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Take Profit (TP)</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk/Reward (RR)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly className="bg-muted"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="exitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exit Price</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="result"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Result</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Win">Win</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                    <SelectItem value="BE">Break Even (BE)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What was your thesis? How was your execution?"
                  className="resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
            <FormLabel>Trade Screenshot</FormLabel>
            <FormControl>
                <Input type="file" accept="image/*" onChange={handleFileChange} className="file:text-primary file:font-medium"/>
            </FormControl>
            {imagePreview && (
                <div className="mt-2 rounded-md overflow-hidden border p-2 max-w-xs mx-auto">
                    <Image src={imagePreview} alt="Screenshot preview" width={300} height={180} className="w-full h-auto object-contain" />
                </div>
            )}
        </div>


        <FormField
          control={form.control}
          name="mistake"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Did you make a mistake on this trade?
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
