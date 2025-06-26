
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useMistakeTags } from "@/hooks/use-mistake-tags";
import { AddMistakeTagDialog } from "./add-mistake-tag-dialog";
import { useAssets } from "@/hooks/use-assets";
import { AddAssetDialog } from "./add-asset-dialog";
import { useStrategies } from "@/hooks/use-strategies";
import { AddStrategyDialog } from "./add-strategy-dialog";

const FormSchema = TradeSchema.omit({ id: true });

type TradeFormProps = {
  trade?: Trade;
  onSave: (trade: Trade) => void;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function TradeForm({ trade, onSave, setOpen }: TradeFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(trade?.screenshot || null);
  const { mistakeTags, addMistakeTag, deleteMistakeTag } = useMistakeTags();
  const { assets, addAsset, deleteAsset } = useAssets();
  const { strategies, addStrategy, deleteStrategy } = useStrategies();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: trade
      ? { 
          ...trade,
          rr: trade.rr ?? 0,
        }
      : {
          date: new Date(),
          asset: "",
          strategy: "",
          direction: "Buy",
          entryTime: "",
          entryPrice: 0,
          sl: 0,
          tp: 0,
          exitPrice: 0,
          rr: 0,
          result: "Win",
          mistakes: [],
          notes: "",
          screenshot: "",
        },
  });

  const { watch, setValue } = form;
  const entryPrice = watch("entryPrice");
  const sl = watch("sl");
  const tp = watch("tp");
  const direction = watch("direction");

  useEffect(() => {
    const entry = parseFloat(entryPrice as any);
    const stopLoss = parseFloat(sl as any);
    const takeProfit = parseFloat(tp as any);

    if (!isNaN(entry) && !isNaN(stopLoss) && !isNaN(takeProfit) && stopLoss !== entry) {
      let rr = 0;
      const risk = Math.abs(entry - stopLoss);
      const reward = Math.abs(takeProfit - entry);
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
      ...data,
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
                      disabled={(date) => date > new Date() && !isSameDay(date, new Date())}
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
                 <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.map(asset => (
                            <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AddAssetDialog assets={assets} addAsset={addAsset} deleteAsset={deleteAsset}/>
                </div>
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
                 <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a strategy" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {strategies.map(strategy => (
                            <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <AddStrategyDialog strategies={strategies} addStrategy={addStrategy} deleteStrategy={deleteStrategy}/>
                </div>
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Win">Win</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                    <SelectItem value="BE">Break Even (BE)</SelectItem>
                    <SelectItem value="Missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="mistakes"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                   <FormLabel className="text-base">Mistakes Made</FormLabel>
                   <AddMistakeTagDialog 
                    mistakeTags={mistakeTags}
                    addMistakeTag={addMistakeTag}
                    deleteMistakeTag={deleteMistakeTag}
                   />
                </div>
                <FormDescription>
                  Select any mistakes you made during this trade.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mistakeTags.map((item) => (
                  <FormItem
                    key={item}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(item)}
                        onCheckedChange={(checked) => {
                          const currentValues = field.value || [];
                          if (checked) {
                            field.onChange([...currentValues, item]);
                          } else {
                            field.onChange(
                              currentValues.filter((value) => value !== item)
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {item}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
